import { JSONValue, JSONSchemaFormState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { eventBus } from '@/lib/event';
import { axios } from '@/lib/axios';
import initTemplates from '@/constants/initTemplates.json';
import { makeObservable, observable } from 'mobx';
import { ProjectEnvsWidget } from '@/components/JSONFormWidgets/ProjectEnvs';
import { v4 as uuidv4 } from 'uuid';
import { hooks } from '@/lib/hooks';
import { PromiseState } from '@/store/standard/PromiseState';
import { ProjectType, StrategyType, ContractLogType, CronJobsType, ChainHeightType, ChainTxType } from '@/server/routers/w3bstream';
import { trpc } from '@/lib/trpc';
import InitializationTemplateWidget from '@/components/JSONFormWidgets/InitializationTemplateWidget';
import { dataURItoBlob, UiSchema } from '@rjsf/utils';
import FileWidget, { FileWidgetUIOptions } from '@/components/JSONFormWidgets/FileWidget';
import { InitProject } from 'pages/api/init';
import SelectTagWidget, { SelectTagWidgetUIOptions } from '@/components/JSONFormWidgets/SelectTagWidget';
import { SelectSqlFileAndEnvFileWidget, SelectSqlFileAndEnvFileWidgetUIOptions } from '@/components/JSONFormWidgets/SelectSqlFileAndEnvFileWidget';
import { helper } from '@/lib/helper';
import EditorWidget, { EditorWidgetUIOptions } from '@/components/JSONFormWidgets/EditorWidget';
import * as jsonpatch from 'fast-json-patch';
import toast from 'react-hot-toast';

export const defaultSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    envs: { type: 'string', title: '' }
  },
  required: ['name']
} as const;

export const initializationTemplateSchema = {
  type: 'object',
  properties: {
    template: { type: 'string', title: 'Select a template', enum: initTemplates.templates.map((t) => t.name) }
  },
  required: ['template']
} as const;

export const developerInitializationTemplateSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    description: { type: 'string', title: 'Description Tags' },
    template: { type: 'string', title: 'Explore Templates' },
    file: { type: 'string', title: 'Code Upload' }
  },
  required: ['name']
} as const;

export const createProjectByWasmSchema = {
  definitions: {
    projects: {
      type: 'string'
    }
  },
  type: 'object',
  properties: {
    file: {
      type: 'string',
      title: 'Upload Single File'
    },
    projectName: { type: 'string', title: 'Project Name' },
    sqlFileAndEnvFile: {
      type: 'string',
      title: ' '
    }
  },
  required: ['file', 'projectName']
} as const;

export const importProjectSchema = {
  type: 'object',
  properties: {
    json: { type: 'string', title: 'Project File' },
    wasm: { type: 'string', title: 'Wasm File' }
  },
  required: []
} as const;

export const editProjectFileSchema = {
  type: 'object',
  properties: {
    code: { type: 'string', title: ' ' }
  },
  required: []
} as const;

type DefaultSchemaType = FromSchema<typeof defaultSchema>;
type InitializationTemplateSchemaType = FromSchema<typeof initializationTemplateSchema>;
type DeveloperInitializationTemplateSchemaType = FromSchema<typeof developerInitializationTemplateSchema>;
type CreateProjectByWasmSchemaType = FromSchema<typeof createProjectByWasmSchema>;
type ImportProjectSchemaType = FromSchema<typeof importProjectSchema>;
type EditProjectFileSchemaType = FromSchema<typeof editProjectFileSchema>;

enum ProjectConfigType {
  PROJECT_DATABASE = 1,
  CONFIG_TYPE__INSTANCE_CACHE = 2,
  PROJECT_ENV = 3
}

export default class ProjectModule {
  allProjects = new PromiseState<() => Promise<any>, ProjectType[]>({
    defaultValue: [],
    function: async () => {
      const projects = await trpc.api.projects.query();
      if (projects) {
        const regex = /(?:[^_]*_){2}(.*)/;
        projects.forEach((p: ProjectType) => {
          const matchArray = p.f_name.match(regex);
          p.name = matchArray ? matchArray[1] : p.f_name;
          p.configs.forEach((config) => {
            // buffer to string cause by prisma client parse error
            config.f_value && (config.f_value = JSON.parse(config.f_value.toString()));
            switch (config.f_type) {
              case ProjectConfigType.PROJECT_DATABASE:
                // @ts-ignore
                // p.database = config.f_value;
                break;
              case ProjectConfigType.PROJECT_ENV:
                // @ts-ignore
                p.envs = config.f_value;
                break;
            }
          });
        });
      }
      return projects;
    }
  });

  projectDetail = new PromiseState<() => Promise<any>, ProjectType>({
    // defaultValue: [],
    function: async () => {
      const projects = await trpc.api.projectDetail.query({
        projectID: String(this.allProjects.current.f_project_id)
      });
      if (projects) {
        const regex = /(?:[^_]*_){2}(.*)/;
        projects.forEach((p: ProjectType) => {
          const matchArray = p.f_name.match(regex);
          p.name = matchArray ? matchArray[1] : p.f_name;
          p.configs.forEach((config) => {
            // buffer to string cause by prisma client parse error
            config.f_value && (config.f_value = JSON.parse(config.f_value.toString()));
            switch (config.f_type) {
              case ProjectConfigType.PROJECT_DATABASE:
                // @ts-ignore
                // p.database = config.f_value;
                break;
              case ProjectConfigType.PROJECT_ENV:
                // @ts-ignore
                p.envs = config.f_value;
                console.log(config.f_value,'config.f_value')
                break;
            }
          });
        });
        return projects[0];
      }
      return null;
    }
  });

  form = new JSONSchemaFormState<DefaultSchemaType>({
    //@ts-ignore
    schema: defaultSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      envs: {
        'ui:widget': ProjectEnvsWidget
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.form.reset();
    },
    customValidate: (formData, errors) => {
      if (formData.name) {
        const re = /^[a-z0-9_]{1,32}$/;
        if (!re.test(formData.name)) {
          errors.name.addError('name field should consist of only lowercase letters, numbers, and underscores, with no spaces; it is no more than 32 characters.');
        }
      }
      return errors;
    },
    value: new JSONValue<DefaultSchemaType>({
      default: {
        name: 'project_01'
      }
    })
  });

  initializationTemplateForm = new JSONSchemaFormState<InitializationTemplateSchemaType>({
    //@ts-ignore
    schema: initializationTemplateSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.initializationTemplateForm.reset();
    },
    value: new JSONValue<InitializationTemplateSchemaType>({
      default: {
        template: ''
      }
    })
  });

  developerInitializationTemplateForm = new JSONSchemaFormState<DeveloperInitializationTemplateSchemaType, UiSchema & { file: FileWidgetUIOptions; description: SelectTagWidgetUIOptions }>({
    //@ts-ignore
    schema: developerInitializationTemplateSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      description: {
        'ui:widget': SelectTagWidget,
        'ui:options': {
          tags: ['Mobility', 'Energy', 'Environmental', 'Healthcare', 'General', 'Smart City', 'Smart Home', 'Geo-location']
        }
      },
      template: {
        'ui:widget': InitializationTemplateWidget,
        flexProps: {
          h: '200px'
        }
      },
      file: {
        'ui:widget': FileWidget,
        'ui:options': {
          accept: {
            'application/wasm': ['.wasm']
          },
          tips: `Code Upload`,
          flexProps: {
            h: '200px',
            borderRadius: '8px'
          }
        }
      },
      layout: ['name', 'description', ['template', 'file']]
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.developerInitializationTemplateForm.reset();
    },
    customValidate: (formData, errors) => {
      if (formData.name) {
        const re = /^[a-z0-9_]{1,32}$/;
        if (!re.test(formData.name)) {
          errors.name.addError('name field should consist of only lowercase letters, numbers, and underscores, with no spaces; it is no more than 32 characters.');
        }
      }
      return errors;
    },
    value: new JSONValue<DeveloperInitializationTemplateSchemaType>({
      default: {
        name: '',
        description: '',
        template: '',
        file: ''
      },
      onSet(e) {
        const { template, file } = e;
        if (template && template != this.value.template) {
          e.file = '';
        }
        if (file && file != this.value.file) {
          e.template = '';
        }
        return e;
      }
    })
  });

  createProjectByWasmForm = new JSONSchemaFormState<CreateProjectByWasmSchemaType, UiSchema & { file: FileWidgetUIOptions; sqlFileAndEnvFile: SelectSqlFileAndEnvFileWidgetUIOptions }>({
    //@ts-ignore
    schema: createProjectByWasmSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      file: {
        'ui:widget': FileWidget,
        'ui:options': {
          accept: {
            'application/wasm': ['.wasm']
          },
          tips: `Drag 'n' drop a file here, or click to select a file`,
          showDownload: true
        }
      },
      sqlFileAndEnvFile: {
        'ui:widget': SelectSqlFileAndEnvFileWidget,
        'ui:options': {
          separator: '<--->'
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.createProjectByWasmForm.reset();
    },
    value: new JSONValue<CreateProjectByWasmSchemaType>({
      //@ts-ignore
      default: {
        projectName: ''
      }
    })
  });

  importProjectForm = new JSONSchemaFormState<ImportProjectSchemaType, UiSchema & { json: FileWidgetUIOptions; wasm: FileWidgetUIOptions }>({
    //@ts-ignore
    schema: importProjectSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      json: {
        'ui:widget': FileWidget,
        'ui:options': {
          resultType: 'JSON',
          accept: {
            'application/json': ['.json']
          },
          tips: `Upload a JSON file`,
          flexProps: {
            h: '400px',
            borderRadius: '4px',
            border: '1px solid #e8e8e8'
          },
          editorTheme: 'vs-light'
        }
      },
      wasm: {
        'ui:widget': FileWidget,
        'ui:options': {
          accept: {
            'application/wasm': ['.wasm']
          },
          tips: `Upload a WASM file`,
          flexProps: {
            h: '100px',
            borderRadius: '8px'
          }
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.importProjectForm.reset();
    },
    customValidate: (formData, errors) => {
      if (!formData.json) {
        errors.json.addError('JSON file is required');
      }
      if (!formData.wasm) {
        errors.wasm.addError('WASM file is required');
      }
      return errors;
    },
    value: new JSONValue<ImportProjectSchemaType>({
      default: {
        json: '',
        wasm: ''
      }
    })
  });

  editProjectFileForm = new JSONSchemaFormState<EditProjectFileSchemaType, UiSchema & { code: EditorWidgetUIOptions }>({
    //@ts-ignore
    schema: editProjectFileSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Save'
      },
      code: {
        'ui:widget': EditorWidget,
        'ui:options': {
          editorHeight: '400px',
          emptyValue: JSON.stringify(
            {
              name: ''
            },
            null,
            2
          )
        }
      }
    },
    customValidate: (formData, errors) => {
      if (formData.code) {
        const documentA = this.projectInfo.value;
        const documentB = helper.json.safeParse(formData.code);
        const diff = jsonpatch.compare(documentA, documentB);
        diff.forEach((item) => {
          if (item.path.includes('name')) {
            errors.code.addError('name is not allowed to be modified');
          }
          if (item.path.includes('database')) {
            errors.code.addError('database is not allowed to be modified');
          }
          if (item.path.includes('wasmFile')) {
            errors.code.addError('wasmFile is not allowed to be modified');
          }
        });
      } else {
        errors.code.addError('is required');
      }
      return errors;
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.editProjectFileForm.reset();
    }
  });

  formMode: 'add' | 'edit' = 'add';
  selectedNames = [];

  get curProject() {
    return this.projectDetail.value;
  }

  constructor() {
    makeObservable(this, {
      formMode: observable,
      selectedNames: observable
    });
  }

  async createProject() {
    this.setMode('add');
    const formData = await hooks.getFormData({
      title: 'Create Project',
      size: '2xl',
      closeOnOverlayClick: false,
      formList: [
        {
          label: 'Default',
          form: this.form
        },
        {
          label: 'Initialization Template',
          form: this.initializationTemplateForm
        }
      ]
    });
    if (formData.name) {
      try {
        const res = await axios.request({
          method: 'post',
          url: '/api/w3bapp/project',
          data: formData
        });
        if (res.data?.project) {
          eventBus.emit('project.create');
          toast.success('create project succeeded');
        }
      } catch (error) {}
    }
    if (formData.template) {
      const templateData = initTemplates.templates.find((i) => i.name === formData.template);
      const data = JSON.parse(JSON.stringify(templateData));
      const templateProjectName = templateData.project[0].name;
      data.project[0].name = `${templateProjectName}_${uuidv4().slice(0, 4)}`;
      data.project[0].database = undefined;
      const res = await axios.request({
        method: 'post',
        url: `/api/init`,
        data
      });
      if (res.data?.message === 'OK') {
        const { createdProjectIds } = res.data;
        for (let index = 0; index < createdProjectIds.length; index++) {
          const projectID = createdProjectIds[index];
          const database = templateData.project[index].database;
          if (database?.schemas) {
            await globalThis.store.w3s.dbTable.importTables({
              projectID,
              schemas: database.schemas
            });
          }
        }
        toast.success('Create project succeeded');
        eventBus.emit('project.create');
      }
    }
  }

  async createProjectByWasm() {
    const formData = await hooks.getFormData({
      title: 'Create Project By Wasm',
      size: 'md',
      formList: [
        {
          form: this.createProjectByWasmForm
        }
      ]
    });
    if (formData.file && formData.projectName) {
      const projectData: InitProject = {
        name: formData.projectName,
        description: '',
        applets: [{ wasmRaw: formData.file, appletName: 'applet_01' }],
        datas: [{ monitor: { contractLog: null } }]
      };
      let sqlSchema;
      if (formData.sqlFileAndEnvFile) {
        const [sqlCode, envCode, contractLogMonitor] = formData.sqlFileAndEnvFile.split('<--->');
        if (sqlCode) {
          sqlSchema = helper.json.safeParse(sqlCode);
        }
        if (envCode) {
          projectData.envs = helper.json.safeParse(envCode);
        }
        if (contractLogMonitor) {
          projectData.datas[0].monitor.contractLog = helper.json.safeParse(contractLogMonitor);
        }
      }
      try {
        const res = await axios.request({
          method: 'post',
          url: `/api/init`,
          data: {
            project: [projectData]
          }
        });
        if (res.data?.message === 'OK') {
          console.log(sqlSchema,'json.database.schemas')
          if (sqlSchema) {
            const projectID = res.data.createdProjectIds[0];
            await globalThis.store.w3s.dbTable.importTables({
              projectID,
              schemas: sqlSchema.schemas
            });
          }
          eventBus.emit('project.create');
          // eventBus.emit('contractlog.create');
        }
      } catch (error) {
        console.log('error', error);
        throw new Error(error);
      }
    }
  }
  createProjectForDeveloper = new PromiseState({
    loadingText: 'Creating Project...',
    context: this,
    async function() {
      let formData = {
        name: '',
        description: '',
        template: '',
        file: ''
      };
      try {
        formData = await hooks.getFormData({
          title: 'Create a New Project',
          size: '2xl',
          closeOnOverlayClick: false,
          formList: [
            {
              form: this.developerInitializationTemplateForm
            }
          ]
        });
      } catch (error) {
        this.developerInitializationTemplateForm.reset();
        return;
      }
      const projectName = formData.name;
      if (formData.template) {
        const templateData = initTemplates.templates.find((i) => i.name === formData.template);
        const data = JSON.parse(JSON.stringify(templateData));
        data.project[0].name = projectName;
        data.project[0].description = formData.description;
        data.project[0].database = undefined;
        try {
          const res = await axios.request({
            method: 'post',
            url: `/api/init`,
            data
          });
          if (res.data?.message === 'OK') {
            const { createdProjectIds } = res.data;
            for (let index = 0; index < createdProjectIds.length; index++) {
              const projectID = createdProjectIds[index];
              const database = templateData.project[index].database;
              if (database?.schemas) {
                await globalThis.store.w3s.dbTable.importTables({
                  projectID,
                  schemas: database.schemas
                });
              }
            }
            toast.success('Create project succeeded');
          }
        } catch (error) {}
        eventBus.emit('project.create');
        return;
      }

      try {
        const res = await axios.request({
          method: 'post',
          url: '/api/w3bapp/project',
          data: {
            name: projectName,
            description: formData.description
          }
        });
        if (res.data?.projectID) {
          if (formData.file) {
            const data = new FormData();
            const file = dataURItoBlob(formData.file);
            data.append('file', file.blob);
            data.append(
              'info',
              JSON.stringify({
                projectName,
                appletName: 'applet_01',
                wasmName: file.name,
                start: true
              })
            );
            const res = await axios.request({
              method: 'post',
              url: `/api/file?api=applet/x/${projectName}`,
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              data
            });
            if (res.data) {
              eventBus.emit('project.create');
              toast.success('create project succeeded');
            }
          } else {
            eventBus.emit('project.create');
            toast.success('create project succeeded');
          }
        }
      } catch (error) {
        toast.error(error.message || 'create project failed');
      }
    }
  });

  async setMode(mode: 'add' | 'edit') {
    this.formMode = mode;
    if (mode === 'add') {
      this.form.reset();
      this.form.uiSchema['ui:submitButtonOptions'].norender = false;
      this.form.uiSchema.name = {
        'ui:disabled': false
      };
    } else {
      this.form.uiSchema['ui:submitButtonOptions'].norender = true;
      this.form.uiSchema.name = {
        'ui:disabled': true
      };
    }
  }

  selectProjectName(projectName: string, checked: boolean) {
    const index = this.selectedNames.findIndex((i) => i === projectName);
    if (checked && index === -1) {
      this.selectedNames.push(projectName);
    }
    if (!checked && index !== -1) {
      this.selectedNames.splice(index, 1);
    }
  }

  resetSelectedNames() {
    this.selectedNames = [];
  }

  projectInfo = new PromiseState({
    loadingText: 'please waiting...',
    function: async () => {
      const schemas = await globalThis.store.w3s.dbTable.exportTables();
      return {
        name: this.curProject?.name,
        description: this.curProject?.f_description,
        database: {
          schemas
        },
        envs: this.curProject?.envs,
        cronJob: globalThis.store.w3s.cronJob.curCronJobs.map((i) => ({
          eventType: i.f_event_type,
          cronExpressions: i.f_cron_expressions
        })),
        contractLog: globalThis.store.w3s.contractLogs.curProjectContractLogs.map((i) => ({
          eventType: i.f_event_type,
          chainID: Number(i.f_chain_id),
          contractAddress: i.f_contract_address,
          blockStart: Number(i.f_block_start),
          blockEnd: Number(i.f_block_end),
          topic0: i.f_topic0
        })),
        chainHeight: globalThis.store.w3s.chainHeight.curProjectChainHeight.map((i) => ({
          eventType: i.f_event_type,
          chainID: Number(i.f_chain_id),
          height: Number(i.f_height)
        })),
        eventRounting: globalThis.store.w3s.strategy.curStrategies.map((i) => ({
          eventType: i.f_event_type,
          handler: i.f_handler
        }))
      };
    }
  });

  async exportProject() {
    await this.projectInfo.call();
    helper.download.downloadJSON(`w3bstream`, this.projectInfo.value);
    globalThis.store.w3s.applet.downloadWasmFile();
  }

  importProject = new PromiseState({
    loadingText: 'importing project...',
    function: async () => {
      let formData;
      try {
        formData = await hooks.getFormData({
          title: 'Import Project',
          size: '2xl',
          closeOnOverlayClick: false,
          formList: [
            {
              form: this.importProjectForm
            }
          ]
        });
      } catch (error) {
        this.importProjectForm.reset();
        return;
      }
      if (formData.json && formData.wasm) {
        const json = helper.json.safeParse(formData.json);
        try {
          const projectName = json.name;
          const body: any = {
            name: projectName,
            description: json.description
          };
          if (json.envs?.env) {
            body.envs = json.envs;
          }
          const res = await axios.request({
            method: 'post',
            url: '/api/w3bapp/project',
            data: body
          });
          const projectID = res.data?.projectID;
         
          if (projectID) {
            if (json.database?.schemas) {
              await globalThis.store.w3s.dbTable.importTables({
                projectID,
                schemas: json.database.schemas
              });
            }
            const data = new FormData();
            const file = dataURItoBlob(formData.wasm);
            data.append('file', file.blob);
            data.append(
              'info',
              JSON.stringify({
                projectName,
                appletName: 'applet_01',
                wasmName: file.name,
                start: true
              })
            );
            const res = await axios.request({
              method: 'post',
              url: `/api/file?api=applet/x/${projectName}`,
              headers: {
                'Content-Type': 'multipart/form-data'
              },
              data
            });
            if (res.data) {
              const appletID = res.data?.appletID;
              const createData = async ({ getPostUrl, list }: { getPostUrl: () => string; list: any }) => {
                for (const item of list) {
                  try {
                    await axios.request({
                      method: 'post',
                      url: getPostUrl(),
                      data: item
                    });
                  } catch (error) {}
                }
              };
              if (json.cronJob && Array.isArray(json.cronJob)) {
                await createData({
                  list: json.cronJob,
                  getPostUrl: () => `/api/w3bapp/cronjob/${projectID}`
                });
              }
              if (json.contractLog && Array.isArray(json.contractLog)) {
                await createData({
                  list: json.contractLog,
                  getPostUrl: () => `/api/w3bapp/monitor/x/${projectName}/contract_log`
                });
              }
              if (json.chainHeight && Array.isArray(json.chainHeight)) {
                await createData({
                  list: json.chainHeight,
                  getPostUrl: () => `/api/w3bapp/monitor/x/${projectName}/chain_height`
                });
              }
              if (json.eventRounting && Array.isArray(json.eventRounting)) {
                await createData({
                  list: json.eventRounting.map((i) => ({
                    ...i,
                    appletID
                  })),
                  getPostUrl: () => `/api/w3bapp/strategy/x/${projectName}`
                });
              }
              eventBus.emit('project.create');
              toast.success('import project succeeded');
            }
          }
        } catch (error) {}
      }
    }
  });

  async editProjectFile() {
    await this.projectInfo.call();
    const documentA = this.projectInfo.value;
    this.editProjectFileForm.value.set({
      code: JSON.stringify(documentA, null, 2)
    });
    const formData = await hooks.getFormData({
      title: 'Edit Project',
      size: '2xl',
      closeOnOverlayClick: false,
      formList: [
        {
          form: this.editProjectFileForm
        }
      ]
    });
    if (formData.code) {
      const handleTriggers = async <T>({
        list,
        getPostUrl,
        getDeleteUrl,
        getUpdateUrl,
        getParams,
        operation,
        formFieldMap
      }: {
        list: T[];
        getPostUrl: () => string;
        getDeleteUrl: (item: T) => string;
        getUpdateUrl?: (item: T) => string;
        getParams?: (item: T) => {
          [key: string]: any;
        };
        operation: jsonpatch.Operation;
        formFieldMap: {
          [formField: string]: {
            k: string;
            type: string;
          };
        };
      }) => {
        if (operation.op === 'add') {
          try {
            await axios.request({
              method: 'post',
              url: getPostUrl(),
              data: operation.value
            });
          } catch (error) {}
        }
        if (operation.op === 'remove') {
          try {
            const index = operation.path.split('/')[2];
            if (index) {
              const item = list[Number(index)];
              if (item) {
                await axios.request({
                  method: 'delete',
                  url: getDeleteUrl(item),
                  params: getParams ? getParams(item) : undefined
                });
              }
            } else {
              for (const item of list) {
                await axios.request({
                  method: 'delete',
                  url: getDeleteUrl(item),
                  params: getParams ? getParams(item) : undefined
                });
              }
            }
          } catch (error) {}
        }
        if (operation.op === 'replace') {
          try {
            const [, , index, field] = operation.path.split('/');
            if (index && field) {
              const item = list[Number(index)];
              const data = Object.fromEntries(
                Object.entries(formFieldMap).map(([formField, tableField]) => {
                  const fieldValue = tableField.type === 'number' ? Number(item[tableField.k]) : item[tableField.k];
                  return [formField, fieldValue];
                })
              );
              data[field] = operation.value;
              if (getUpdateUrl) {
                await axios.request({
                  method: 'put',
                  url: getUpdateUrl(item),
                  data
                });
              } else {
                await axios.request({
                  method: 'post',
                  url: getPostUrl(),
                  data
                });
                await axios.request({
                  method: 'delete',
                  url: getDeleteUrl(item)
                });
              }
            }
          } catch (error) {}
        }
      };
      const documentB = helper.json.safeParse(formData.code);
      const diff = jsonpatch.compare(documentA, documentB);
      for (const item of diff) {
        if (item.path.includes('envs')) {
          try {
            const values = documentB.envs?.env || [];
            if (values.length > 0) {
              await axios.post(`/api/w3bapp/project_config/x/${documentA.name}/PROJECT_ENV`, { env: values });
            }
          } catch (error) {}
        }
        if (item.path.includes('cronJob')) {
          await handleTriggers<CronJobsType>({
            list: globalThis.store.w3s.cronJob.list.value,
            getPostUrl: () => `/api/w3bapp/cronjob/${this.curProject?.f_project_id}`,
            getDeleteUrl: (v) => `/api/w3bapp/cronjob/data/${v.f_cron_job_id}`,
            operation: item,
            formFieldMap: {
              eventType: {
                k: 'f_event_type',
                type: 'string'
              },
              cronExpressions: {
                k: 'f_cron_expressions',
                type: 'string'
              }
            }
          });
        }
        if (item.path.includes('contractLog')) {
          await handleTriggers<ContractLogType>({
            list: globalThis.store.w3s.contractLogs.curProjectContractLogs,
            getPostUrl: () => `/api/w3bapp/monitor/x/${this.curProject?.name}/contract_log`,
            getDeleteUrl: (v) => `/api/w3bapp/monitor/x/${this.curProject?.name}/contract_log/${v.f_contractlog_id}`,
            operation: item,
            formFieldMap: {
              eventType: {
                k: 'f_event_type',
                type: 'string'
              },
              chainID: {
                k: 'f_chain_id',
                type: 'number'
              },
              contractAddress: {
                k: 'f_contract_address',
                type: 'string'
              },
              blockStart: {
                k: 'f_block_start',
                type: 'number'
              },
              blockEnd: {
                k: 'f_block_end',
                type: 'number'
              },
              topic0: {
                k: 'f_topic0',
                type: 'number'
              }
            }
          });
        }
        if (item.path.includes('chainHeight')) {
          await handleTriggers<ChainHeightType>({
            list: globalThis.store.w3s.chainHeight.curProjectChainHeight,
            getPostUrl: () => `/api/w3bapp/monitor/x/${this.curProject?.name}/chain_height`,
            getDeleteUrl: (v) => `/api/w3bapp/monitor/x/${this.curProject?.name}/chain_height/${v.f_chain_height_id}`,
            operation: item,
            formFieldMap: {
              eventType: {
                k: 'f_event_type',
                type: 'string'
              },
              chainID: {
                k: 'f_chain_id',
                type: 'number'
              },
              height: {
                k: 'f_height',
                type: 'number'
              }
            }
          });
        }
        if (item.path.includes('eventRounting')) {
          if (item.op === 'add') {
            const applet = this.curProject?.applets?.[0];
            item.value = {
              ...item.value,
              appletID: applet?.f_applet_id
            };
          }
          await handleTriggers<StrategyType>({
            list: globalThis.store.w3s.strategy.curStrategies,
            getPostUrl: () => `/api/w3bapp/strategy/x/${this.curProject?.name}`,
            getDeleteUrl: (v) => `/api/w3bapp/strategy/x/${this.curProject?.name}`,
            getUpdateUrl: (v) => `/api/w3bapp/strategy/${v.f_strategy_id}`,
            getParams: (v) => ({ strategyID: v.f_strategy_id }),
            operation: item,
            formFieldMap: {
              appletID: {
                k: 'f_applet_id',
                type: 'string'
              },
              eventType: {
                k: 'f_event_type',
                type: 'string'
              },
              handler: {
                k: 'f_handler',
                type: 'string'
              }
            }
          });
        }
      }
      if (diff.length > 0) {
        eventBus.emit('project.create');
      }
    }
  }
}

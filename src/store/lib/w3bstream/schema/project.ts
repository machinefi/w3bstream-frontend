import { JSONValue, JSONSchemaFormState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { showNotification } from '@mantine/notifications';
import { eventBus } from '@/lib/event';
import { axios } from '@/lib/axios';
import initTemplates from '@/constants/initTemplates.json';
import { makeObservable, observable } from 'mobx';
import { ProjectEnvsWidget } from '@/components/JSONFormWidgets/ProjectEnvs';
import { v4 as uuidv4 } from 'uuid';
import { hooks } from '@/lib/hooks';
import { PromiseState } from '@/store/standard/PromiseState';
import { AppletType, ProjectType, PublisherType, InstanceType, StrategyType } from '@/server/routers/w3bstream';
import { trpc } from '@/lib/trpc';
import InitializationTemplateWidget from '@/components/JSONFormWidgets/InitializationTemplateWidget';
import { dataURItoBlob, UiSchema } from '@rjsf/utils';
import FileWidget, { FileWidgetUIOptions } from '@/components/JSONFormWidgets/FileWidget';
import { Project } from 'pages/api/init';
import SelectTagWidget, { SelectTagWidgetUIOptions } from '@/components/JSONFormWidgets/SelectTagWidget';

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
    tags: { type: 'string', title: 'Description Tags' },
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
    projectName: { type: 'string', title: 'Project Name' }
  },
  required: ['file', 'projectName']
} as const;

type DefaultSchemaType = FromSchema<typeof defaultSchema>;
type InitializationTemplateSchemaType = FromSchema<typeof initializationTemplateSchema>;
type DeveloperInitializationTemplateSchemaType = FromSchema<typeof developerInitializationTemplateSchema>;
type CreateProjectByWasmSchemaType = FromSchema<typeof createProjectByWasmSchema>;

interface Env {
  id: string;
  key: string;
  value: string;
}

interface OnLoadCompletedProps {
  applets: AppletType[];
  publishers: PublisherType[];
  instances: InstanceType[];
  strategies: StrategyType[];
}

export default class ProjectModule {
  allProjects = new PromiseState<() => Promise<any>, ProjectType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.projects.query();
      if (res) {
        const applets = [];
        const instances = [];
        let strategies = [];
        let publishers = [];
        res.forEach((p: ProjectType) => {
          // p.project_files = new FilesListSchema();
          p.applets.forEach((a: AppletType) => {
            a.project_name = p.f_name;
            a.instances.forEach((i) => {
              instances.push({
                project_id: p.f_project_id,
                project_name: p.f_name,
                applet_id: a.f_applet_id,
                applet_name: a.f_name,
                ...i
              });
            });
            applets.push({
              ...a,
              project_name: p.f_name
            });
            strategies = strategies.concat(a.strategies);
          });
          p.publishers.forEach((pub) => {
            // @ts-ignore
            pub.project_id = p.f_project_id;
            // @ts-ignore
            pub.project_name = p.f_name;
            publishers.push(pub);
          });
        });
        // console.log(toJS(res));
        this.onLoadCompleted({
          applets,
          publishers,
          instances,
          strategies
        });
      }
      return res;
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
        const re = /^\S+$/;
        if (!re.test(formData.name)) {
          errors.name.addError('Name cannot contain spaces');
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

  developerInitializationTemplateForm = new JSONSchemaFormState<DeveloperInitializationTemplateSchemaType, UiSchema & { file: FileWidgetUIOptions; tags: SelectTagWidgetUIOptions }>({
    //@ts-ignore
    schema: developerInitializationTemplateSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      tags: {
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
      layout: ['name', 'tags', ['template', 'file']]
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.developerInitializationTemplateForm.reset();
    },
    customValidate: (formData, errors) => {
      if (formData.name) {
        const re = /^[a-z][a-z0-9_-]*$/;
        if (!re.test(formData.name)) {
          errors.name.addError('field starts with a lowercase letter and includes only lowercase letters, numbers, and no spaces');
        }
      }
      return errors;
    },
    value: new JSONValue<DeveloperInitializationTemplateSchemaType>({
      default: {
        name: '',
        tags: '',
        template: '',
        file: ''
      }
    })
  });

  createProjectByWasmForm = new JSONSchemaFormState<CreateProjectByWasmSchemaType, UiSchema & { file: FileWidgetUIOptions }>({
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
          tips: `Drag 'n' drop a file here, or click to select a file`
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.form.reset();
    },
    value: new JSONValue<CreateProjectByWasmSchemaType>({
      //@ts-ignore
      default: {
        projectName: ''
      }
    })
  });

  formMode: 'add' | 'edit' = 'add';

  envs: Env[] = [];

  onAddEnv() {
    this.envs.push({
      id: uuidv4(),
      key: '',
      value: ''
    });
  }

  onDeleteEnv(id: string) {
    this.envs = this.envs.filter((i) => i.id !== id);
  }

  onChangeEnv(id: string, key: string, value: string) {
    for (let i = 0; i < this.envs.length; i++) {
      const item = this.envs[i];
      if (item.id === id) {
        item.key = key;
        item.value = value;
        break;
      }
    }
  }

  async setMode(mode: 'add' | 'edit') {
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
    this.formMode = mode;
    this.setEnvs();
  }

  async setEnvs() {
    if (this.formMode === 'edit') {
      const envs = this.curProject?.config?.env || [];
      this.envs =
        envs.length > 0
          ? envs
          : [
              {
                id: uuidv4(),
                key: '',
                value: ''
              }
            ];
    } else {
      this.envs = [
        {
          id: uuidv4(),
          key: '',
          value: ''
        }
      ];
    }
  }

  async onSaveEnv() {
    const values = this.envs.filter((item) => !!item.key).map((item) => [item.key, item.value]);
    if (values.length) {
      const projectName = globalThis.store.w3s.config.form.formData.accountRole === 'DEVELOPER' ? this.curProject?.f_name : this.form.value.get().name;
      if (projectName) {
        try {
          await axios.post(`/api/w3bapp/project_config/${projectName}/PROJECT_ENV`, { env: values });
          showNotification({ message: 'Save environment variables successfully' });
        } catch (error) {
          throw error;
        }
      } else {
        showNotification({
          color: 'red',
          message: 'Project name is empty'
        });
      }
    }
  }

  async createProject() {
    this.setMode('add');
    const formData = await hooks.getFormData({
      title: 'Create Project',
      size: '2xl',
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
          await showNotification({ message: 'create project succeeded' });
          await this.onSaveEnv();
        }
      } catch (error) {}
    }
    if (formData.template) {
      const templateData = initTemplates.templates.find((i) => i.name === formData.template);
      const data = JSON.parse(JSON.stringify(templateData));
      const templateProjectName = templateData.project[0].name;
      data.project[0].name = `${templateProjectName}_${uuidv4().slice(0, 4)}`;
      const res = await axios.request({
        method: 'post',
        url: `/api/init`,
        data
      });
      if (res.data) {
        await showNotification({ message: 'Create project succeeded' });
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
    // formData.file
    // {
    //   "name": "mint_nft_template",
    //   "description": "",
    //   "applets": [{ "wasmRaw": "https://raw.githubusercontent.com/machinefi/w3bstream-wasm-ts-sdk/main/examples/wasms/mint_nft.wasm", "appletName": "applet_01" }],
    //   "datas": []
    // }
    if (formData.file && formData.projectName) {
      const initProjectData: { project: Project[] } = {
        project: [
          {
            name: formData.projectName,
            description: '',
            applets: [{ wasmRaw: formData.file, appletName: 'applet_01' }],
            datas: []
          }
        ]
      };
      const res = await axios.request({
        method: 'post',
        url: `/api/init`,
        data: initProjectData
      });
      if (res.data) {
        await showNotification({ message: 'Create project succeeded' });
        eventBus.emit('project.create');
      }
    }
  }

  async editProject() {
    this.setMode('edit');
    await hooks.getFormData({
      title: 'Project Details',
      size: '2xl',
      formList: [
        {
          form: this.form
        }
      ]
    });
  }

  async createProjectForDeleveloper() {
    let formData = {
      name: '',
      tags: '',
      template: '',
      file: ''
    };
    try {
      formData = await hooks.getFormData({
        title: 'Create a New Project',
        size: '2xl',
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
    if (formData.template) {
      const templateData = initTemplates.templates.find((i) => i.name === formData.template);
      const data = JSON.parse(JSON.stringify(templateData));
      data.project[0].name = formData.name;
      try {
        const res = await axios.request({
          method: 'post',
          url: `/api/init`,
          data
        });
        if (res.data) {
          showNotification({ message: 'Create project succeeded' });
        }
      } catch (error) {}
      eventBus.emit('project.create');
      return;
    }

    const projectName = formData.name;
    try {
      const res = await axios.request({
        method: 'post',
        url: '/api/w3bapp/project',
        data: {
          name: projectName
        }
      });
      if (res.data?.project) {
        if (formData.file) {
          const data = new FormData();
          const file = dataURItoBlob(formData.file);
          data.append('file', file.blob);
          data.append(
            'info',
            JSON.stringify({
              projectName,
              appletName: 'applet_01',
              wasmName: file.name
            })
          );
          const res = await axios.request({
            method: 'post',
            url: `/api/file?api=applet/${projectName}`,
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            data
          });
          const appletID = res.data?.appletID;
          if (appletID) {
            const instanceID = await globalThis.store.w3s.applet.deployApplet({ appletID, triggerEvent: false });
            if (instanceID) {
              globalThis.store.w3s.instances.handleInstance({ instanceID, event: 'START' });
              eventBus.emit('project.create');
              showNotification({ message: 'create project succeeded' });
            }
          }
        } else {
          eventBus.emit('project.create');
          showNotification({ message: 'create project succeeded' });
        }
      }
    } catch (error) {
      showNotification({ color: 'red', message: error.message });
    }
  }

  get curProject() {
    return this.allProjects.current;
  }

  selectedNames = [];

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

  constructor({
    onLoadCompleted
  }: Partial<{
    onLoadCompleted: (data: OnLoadCompletedProps) => void;
  }> = {}) {
    makeObservable(this, {
      envs: observable,
      formMode: observable,
      selectedNames: observable
    });

    if (onLoadCompleted) {
      this.onLoadCompleted = onLoadCompleted;
    }
  }

  onLoadCompleted(data: OnLoadCompletedProps) {}
}

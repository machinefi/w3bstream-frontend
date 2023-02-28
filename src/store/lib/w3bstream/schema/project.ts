import { JSONValue, JSONSchemaFormState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { showNotification } from '@mantine/notifications';
import { eventBus } from '@/lib/event';
import { axios } from '@/lib/axios';
import initTemplates from '@/constants/initTemplates.json';
import { makeObservable, observable } from 'mobx';
import { ProjectEnvsWidget } from '@/components/JSONFormWidgets/ProjectEnvs';
import { v4 as uuidv4 } from 'uuid';
import EditorWidget from '@/components/JSONFormWidgets/EditorWidget';
import { rootStore } from '@/store/index';
import { hooks } from '@/lib/hooks';

export const defaultSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    envs: { type: 'string', title: '' },
    dbSchema: { type: 'string', title: 'Project Database Schema' }
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

type DefaultSchemaType = FromSchema<typeof defaultSchema>;
type InitializationTemplateSchemaType = FromSchema<typeof initializationTemplateSchema>;
interface Env {
  id: string;
  key: string;
  value: string;
}

export default class ProjectModule {
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
      },
      dbSchema: {
        'ui:widget': EditorWidget,
        'ui:options': {
          readOnly: false
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.form.reset();
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
  async setEnvs() {
    if (this.formMode === 'edit') {
      this.envs = globalThis.store.w3s.curProject?.config?.env || [
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
    const projectName = this.form.value.get().name;
    const values = this.envs.filter((item) => !!item.key).map((item) => [item.key, item.value]);
    if (values.length) {
      try {
        await axios.post(`/api/w3bapp/project_config/${projectName}/PROJECT_ENV`, { env: values });
        await showNotification({ message: 'Save environment variables successfully' });
      } catch (error) {
        throw error;
      }
    }
  }

  async onSaveDBSchema() {
    const projectName = this.form.value.get().name;
    const dbSchema = this.form.value.get().dbSchema;
    if (!dbSchema) return;
    await axios.post(`/api/w3bapp/project_config/${projectName}/PROJECT_SCHEMA`, dbSchema, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    await showNotification({ message: 'create database succeeded!' });
  }

  async setMode(mode: 'add' | 'edit') {
    if (mode === 'add') {
      this.form.reset();
      this.form.uiSchema['ui:submitButtonOptions'].norender = false;
      this.form.uiSchema.name = {
        'ui:disabled': false
      };
      this.form.uiSchema.dbSchema['ui:options'].showSubmitButton = false;
      this.form.uiSchema.dbSchema['ui:options'].readOnly = false;
      this.form.value.set({
        dbSchema: ''
      });
    } else {
      this.form.uiSchema['ui:submitButtonOptions'].norender = true;
      this.form.uiSchema.name = {
        'ui:disabled': true
      };
      await rootStore.w3s.allProjects.call();
      this.setDBSchema();
    }
    this.formMode = mode;
    this.setEnvs();
  }

  setDBSchema() {
    if (!globalThis.store.w3s.curProject?.config?.schema) {
      this.form.uiSchema.dbSchema['ui:options'].showSubmitButton = true;
      this.form.uiSchema.dbSchema['ui:options'].afterSubmit = (value: string) => {
        this.form.value.set({
          dbSchema: value
        });
        this.onSaveDBSchema();
      };
      this.form.value.set({
        dbSchema: ''
      });
    } else {
      this.form.uiSchema.dbSchema['ui:options'].showSubmitButton = false;
      this.form.uiSchema.dbSchema['ui:options'].readOnly = true;
      this.form.value.set({
        dbSchema: JSON.stringify(globalThis.store.w3s.curProject?.config?.schema, null, 2)
      });
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
        if (res.data) {
          eventBus.emit('project.create');
          await showNotification({ message: 'create project succeeded' });
        }
        await this.onSaveEnv();
        await this.onSaveDBSchema();
      } catch (error) {}
    }
    if (formData.template) {
      const data = initTemplates.templates.find((i) => i.name === formData.template);
      const res = await axios.request({
        method: 'post',
        url: `/api/init?adminKey=iotex.W3B.admin`,
        data
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

  constructor() {
    makeObservable(this, {
      envs: observable,
      formMode: observable
    });
  }
}

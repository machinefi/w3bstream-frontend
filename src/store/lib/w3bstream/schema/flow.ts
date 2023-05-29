import { JSONValue, JSONSchemaFormState, JSONModalValue } from '@/store/standard/JSONSchemaState';
import { eventBus } from '@/lib/event';
// import { FlowType } from '@/server/routers/flow';
import { FlowState } from '@/store/standard/FlowState';
import EditorWidget, { EditorWidgetUIOptions } from '@/components/JSONFormWidgets/EditorWidget';
import { UiSchema } from '@rjsf/utils';
import { PromiseState } from '@/store/standard/PromiseState';
import { makeObservable, observable } from 'mobx';
import { v4 as uuid } from 'uuid';
import { createFlowSchema, codeNodeSchema, webhookNodeSchema, CreateFlowSchemaType, WebhookNodeSchemaType, CodeNodeSchemaType, EnvSchemaType, envSchema } from './flow.schema';
import { rootStore } from '@/store/index';
import { t } from '@/server/trpc';
import toast from 'react-hot-toast';

export type FlowType = {
  id: number;
  name: string;
  data: any;
  update_time: Date;
  create_time: Date;
  extra_data: any;
};

export default class FlowModule {
  list = new PromiseState<any, FlowType[]>({
    defaultValue: [],
    function: async () => {
      const teamId = globalThis.store.ide.teamModule.currentTeam?.id;
      if (teamId) {
        // const result = await client.flow.flows.query({
        //   teamId
        // });
        // return result;
      }
      return [];
    }
  });
  deleteFlow = new PromiseState<any, FlowType>({
    function: async (id: number) => {
      toast.loading('Flow Deleting');
      try {
        // const result = await client.flow.delete.mutate({
        //   id
        // });
        // if (result) {
        //   this.list.call();
        // }
        // return result;
      } catch (e) {
        toast.error(rootStore.lang.t("error.flow.deleted.msg"))
      }
    }
  });
  duplicateFlow = new PromiseState<any, FlowType>({
    loadingText: 'Flow Duplicating',
    function: async (flow: { name: any; data: any; timeId: any }) => {
      try {
        // const result = await client.flow.create.mutate(flow);
        // if (result) {
        //   this.list.call();
        // }
        // return result;
      } catch (e) {
        toast.error(rootStore.lang.t("error.flow.duplicated.msg"))
      }
    }
  });
  tempList = new PromiseState<any, FlowType[]>({
    defaultValue: [],
    function: async () => {
      // const result = await client.flow.flowTemplates.query();
      return [];
    }
  });
  flow = new FlowState();
  createFlowForm = new JSONSchemaFormState<CreateFlowSchemaType>({
    //@ts-ignore
    schema: createFlowSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.createFlowForm.reset();
    },
    value: new JSONValue<CreateFlowSchemaType>({
      default: {
        name: ''
      }
    })
  });
  codeNodeForm = new JSONSchemaFormState<
    CodeNodeSchemaType,
    UiSchema & {
      code: EditorWidgetUIOptions;
    }
  >({
    //@ts-ignore
    schema: codeNodeSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'OK'
      },
      code: {
        'ui:widget': EditorWidget,
        'ui:options': {
          emptyValue: ``,
          lang: 'javascript',
          editorHeight: '400px'
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.codeNodeForm.reset();
    },
    value: new JSONValue<CodeNodeSchemaType>({
      default: {
        label: '',
        code: ''
      }
    })
  });
  webhookNodeForm = new JSONSchemaFormState<
    WebhookNodeSchemaType,
    UiSchema & {
      body: EditorWidgetUIOptions;
    }
  >({
    //@ts-ignore
    schema: webhookNodeSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'OK'
      },
      body: {
        'ui:widget': EditorWidget,
        'ui:options': {
          emptyValue: `{}`,
          lang: 'json',
          editorHeight: '400px'
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.codeNodeForm.reset();
    },
    value: new JSONValue<WebhookNodeSchemaType>({
      default: {
        label: '',
        url: '',
        id: uuid(),
        authentication: 'None',
        method: 'GET',
        body: `{}`
      }
    })
  });
  envForm = new JSONSchemaFormState<
    EnvSchemaType,
    UiSchema & {
      env: EditorWidgetUIOptions;
    }
  >({
    //@ts-ignore
    schema: envSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      env: {
        'ui:widget': EditorWidget,
        'ui:options': {
          emptyValue: `{}`,
          lang: 'json',
          editorHeight: '400px'
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
    },
    value: new JSONValue<EnvSchemaType>({
      default: {
        env: '{}'
      }
    })
  });

  constructor() {
    makeObservable(this, {
      list: observable,
      tempList: observable
    });
  }

  async findFlowById(id: number) {
    this.flow.reset();
    try {
      // const result = await client.flow.findFlowById.mutate({
      //   id
      // });
      // const flowData = result?.data;
      // if (flowData) {
      //   //@ts-ignore
      //   this.flow.importJSON(flowData);
      // }
      return [];
    } catch (error) {
      toast.error(error.message || error.data?.message);
    }
  }

  async saveFlow(id: number) {
    globalThis.store.ide.showLoadingOverlay = true;
    try {
      // const result = await client.flow.update.mutate({
      //   id,
      //   data: this.flow.exportJSON()
      // });
      // if (result.ok) {
      // }
    } catch (error) {
      toast.error(error.message || error.data?.message);
    }
    globalThis.store.ide.showLoadingOverlay = false;
  }

  async setEnv(id: number, env: string) {
    globalThis.store.ide.showLoadingOverlay = true;
    try {
      // const result = await client.flow.update.mutate({
      //   id,
      //   env
      // });
      // if (result.ok) {
      // }
    } catch (error) {
      toast.error(error.message || error.data?.message);
    }
    globalThis.store.ide.showLoadingOverlay = false;
  }

  modal = new JSONModalValue({
    default: {
      show: false,
      title: 'Create Flow',
      autoReset: true
    }
  });
}

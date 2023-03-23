import { JSONValue, JSONSchemaFormState, JSONSchemaTableState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { eventBus } from '@/lib/event';
import { definitions } from './definitions';
import { ChainHeightType } from '@/server/routers/w3bstream';
import { PromiseState } from '@/store/standard/PromiseState';
import { trpc } from '@/lib/trpc';

export const schema = {
  definitions: {
    projects: {
      type: 'string'
    }
  },
  type: 'object',
  properties: {
    projectName: { $ref: '#/definitions/projects', title: 'Project Name' },
    eventType: { type: 'string', title: 'Event Type' },
    chainID: { type: 'number', title: 'Chain ID' },
    height: { type: 'number', title: 'Height' }
  },
  required: ['projectName', 'eventType', 'chainID', 'height']
} as const;

type SchemaType = FromSchema<typeof schema>;

//@ts-ignore
schema.definitions = {
  projects: definitions.projectName
};

export default class ChainHeightModule {
  allChainHeight = new PromiseState<() => Promise<any>, ChainHeightType[]>({
    defaultValue: [],
    function: async () => {
      const res = await trpc.api.chainHeight.query();
      if (res) {
        this.table.set({
          dataSource: res
        });
      }
      return res;
    }
  });

  get curProjectChainHeight() {
    const curProjectName = globalThis.store.w3s.project.curProject?.f_name || '';
    return this.allChainHeight.value.filter((c) => c.f_project_name === curProjectName);
  }

  table = new JSONSchemaTableState<ChainHeightType>({
    columns: [
      {
        key: 'f_chain_height_id',
        label: 'ChainTx ID'
      },
      {
        key: 'f_project_name',
        label: 'Project Name'
      },
      {
        key: 'f_finished',
        label: 'Finished'
      },
      {
        key: 'f_event_type',
        label: 'Event Type'
      },
      {
        key: 'f_chain_id',
        label: 'Chain ID'
      },
      {
        key: 'f_height',
        label: 'Height'
      },
      {
        key: 'f_updated_at',
        label: 'Updated At'
      }
      // {
      //   key: 'actions',
      //   label: 'Actions',
      //   actions: (item) => {
      //     return [
      //       {
      //         props: {
      //           bg: '#E53E3E',
      //           color: '#fff',
      //           onClick() {
      //             globalThis.store.base.confirm.show({
      //               title: 'Warning',
      //               description: 'Are you sure you want to delete it?',
      //               async onOk() {
      //                 const project = globalThis.store.w3s.project.allProjects.value.find((p) => p.f_name === item.f_project_name);
      //                 try {
      //                   await axios.request({
      //                     method: 'delete',
      //                     url: `/api/w3bapp/monitor/chain_height/${project?.f_name}`,
      //                     data: {
      //                       chainHeightID: item.f_chain_height_id
      //                     }
      //                   });
      //                   eventBus.emit('chainHeight.delete');
      //                   toast.success('Deleted successfully');
      //                 } catch (error) {
      //                   toast.error('Delete failed');
      //                 }
      //               }
      //             });
      //           }
      //         },
      //         text: 'Delete'
      //       }
      //     ];
      //   }
      // }
    ],
    rowKey: 'f_chain_height_id',
    containerProps: { mt: '10px' }
  });

  form = new JSONSchemaFormState<SchemaType>({
    //@ts-ignore
    schema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.form.reset();
    },
    value: new JSONValue<SchemaType>({
      default: {
        projectName: '',
        eventType: 'DEFAULT',
        chainID: 4690,
        height: 0
      }
    })
  });
}

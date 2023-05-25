import { JSONSchemaFormState, JSONSchemaTableState, JSONValue } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { CronJobsType } from '@/server/routers/w3bstream';
import { trpc } from '@/lib/trpc';
import { defaultOutlineButtonStyle } from '@/lib/theme';
import { axios } from '@/lib/axios';
import { eventBus } from '@/lib/event';
import toast from 'react-hot-toast';
import { PromiseState } from '@/store/standard/PromiseState';
import { rootStore } from '@/store/index';

export const schema = {
  type: 'object',
  properties: {
    eventType: { type: 'string', title: 'Event Type', description: 'Please choose a unique name for the W3bstream event that should be triggered' },
    cronExpressions: { type: 'string', title: 'Cron Expressions', description: 'This is the cron setup expression. Check out crontab.guru for an easy to use editor' }
  },
  required: ['eventType', 'cronExpressions']
} as const;

type SchemaType = FromSchema<typeof schema>;

export default class CronJobModule {
  table = new JSONSchemaTableState<CronJobsType>({
    columns: [
      {
        key: 'actions',
        label: 'Actions',
        actions: (item) => {
          return [
            {
              props: {
                size: 'xs',
                ...defaultOutlineButtonStyle,
                onClick() {
                  globalThis.store.base.confirm.show({
                    title: 'Warning',
                    description: 'Are you sure you want to delete it?',
                    async onOk() {
                      try {
                        await axios.request({
                          method: 'delete',
                          url: `/api/w3bapp/cronjob/data/${item.f_cron_job_id}`
                        });
                        eventBus.emit('cronJob.delete', item.f_project_id);
                        toast.success(rootStore.lang.t('success.delete.msg'));
                      } catch (error) {
                        toast.error(rootStore.lang.t('error.delete.msg'));
                      }
                    }
                  });
                }
              },
              text: 'Delete'
            }
          ];
        }
      },
      {
        key: 'f_cron_expressions',
        label: 'Cron Expressions'
      },
      {
        key: 'f_event_type',
        label: 'Event Type'
      },
      {
        key: 'f_created_at',
        label: 'Created At'
      }
    ],
    rowKey: 'f_cron_job_id',
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
        eventType: 'DEFAULT',
        cronExpressions: '* * * * *'
      }
    })
  });

  list = new PromiseState<(projectId) => Promise<any>, CronJobsType[]>({
    defaultValue: [],
    function: async (projectId) => {
      try {
        const res = await trpc.api.cronJobs.query({
          projectId
        });
        if (res) {
          this.table.set({
            dataSource: res
          });
          return res;
        }
      } catch (error) {
        return [];
      }
    }
  });
}

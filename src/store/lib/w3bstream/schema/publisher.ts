import { JSONSchemaFormState, JSONValue, JSONSchemaTableState } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { definitions } from './definitions';
import { axios } from '@/lib/axios';
import { showNotification } from '@mantine/notifications';
import { eventBus } from '@/lib/event';
import { PublisherType } from '@/server/routers/w3bstream';
import { PublisherTokenRender } from '@/components/JSONTable/FieldRender';
import { UiSchema } from '@rjsf/utils';
import EditorWidget, { EditorWidgetUIOptions } from '@/components/JSONFormWidgets/EditorWidget';
import { ShowRequestTemplatesButtonWidget } from '@/components/IDE/PublishEventRequestTemplates';
import { makeObservable, observable } from 'mobx';
import { helper } from '@/lib/helper';
import { hooks } from '@/lib/hooks';
import { defaultOutlineButtonStyle } from '@/lib/theme';

export const createPublisherSchema = {
  definitions: {
    projects: {
      type: 'string'
    }
  },
  type: 'object',
  properties: {
    projectName: { $ref: '#/definitions/projects', title: 'Project Name' },
    key: { type: 'string', title: 'Publisher Key' }
  },
  required: ['projectName', 'key']
} as const;

export const publishEventSchema = {
  definitions: {
    projects: {
      type: 'string'
    },
    publishers: {
      type: 'string'
    }
  },
  type: 'object',
  properties: {
    projectName: { $ref: '#/definitions/projects', title: 'Project Name' },
    publisher: { $ref: '#/definitions/publishers', title: 'Publisher' },
    body: { type: 'string', title: 'Body' },
    showRequestTemplates: { type: 'string', title: '' }
  },
  required: ['projectName', 'body']
} as const;

export const developerPublishEventSchema = {
  type: 'object',
  properties: {
    body: { type: 'string', title: '' }
  },
  required: []
} as const;

type CreatePublisherSchemaType = FromSchema<typeof createPublisherSchema>;
type PublishEventSchemaType = FromSchema<typeof publishEventSchema>;
type DeveloperPublishEventSchemaType = FromSchema<typeof developerPublishEventSchema>;

//@ts-ignore
createPublisherSchema.definitions = {
  projects: definitions.projectName
};

//@ts-ignore
publishEventSchema.definitions = {
  projects: definitions.projectName,
  publishers: definitions.publishers
};

export default class PublisherModule {
  createPublisherForm = new JSONSchemaFormState<CreatePublisherSchemaType>({
    //@ts-ignore
    schema: createPublisherSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.createPublisherForm.reset();
    },
    value: new JSONValue<CreatePublisherSchemaType>({
      default: {
        projectName: '',
        key: ''
      }
    })
  });

  publishEventForm = new JSONSchemaFormState<PublishEventSchemaType, UiSchema & { body: EditorWidgetUIOptions }>({
    //@ts-ignore
    schema: publishEventSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      body: {
        'ui:widget': EditorWidget,
        'ui:options': {
          editorHeight: '400px',
          emptyValue: JSON.stringify({
            header: {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            },
            payload: [
              {
                example: 'This is is an example payload'
              }
            ]
          }),
          showLanguageSelector: true,
          onChangeLanguage: (language) => {
            const header = {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            };
            const payload =
              language === 'text'
                ? ['This is is an example payload']
                : [
                    {
                      example: 'This is is an example payload'
                    }
                  ];
            this.publishEventForm.value.set({
              body: JSON.stringify(
                {
                  header,
                  payload
                },
                null,
                2
              )
            });
          }
        }
      },
      showRequestTemplates: {
        'ui:widget': ShowRequestTemplatesButtonWidget
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
    },
    value: new JSONValue<PublishEventSchemaType>({
      default: {
        projectName: '',
        body: JSON.stringify(
          {
            header: {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            },
            payload: [
              {
                example: 'This is is an example payload'
              }
            ]
          },
          null,
          2
        )
      },
      onSet(e: any) {
        const { publisher } = e;
        if (publisher && publisher != this.value.publisher) {
          const allPublishers = globalThis.store.w3s.publisher.allData;
          const pub = allPublishers.find((item) => String(item.f_publisher_id) === publisher);
          if (pub) {
            const header = {
              event_type: 'ANY',
              pub_id: pub.f_key,
              token: pub.f_token,
              pub_time: Date.now()
            };
            const body = JSON.parse(e.body);
            e.body = JSON.stringify(
              {
                header,
                payload: body.payload
              },
              null,
              2
            );
          }
        }
        return e;
      }
    })
  });

  developerPublishEventForm = new JSONSchemaFormState<DeveloperPublishEventSchemaType, UiSchema & { body: EditorWidgetUIOptions }>({
    //@ts-ignore
    schema: developerPublishEventSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      body: {
        'ui:widget': EditorWidget,
        'ui:options': {
          editorHeight: '400px',
          emptyValue: JSON.stringify({
            header: {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            },
            payload: [
              {
                example: 'This is is an example payload'
              }
            ]
          }),
          showLanguageSelector: false
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.developerPublishEventForm.reset();
    },
    value: new JSONValue<DeveloperPublishEventSchemaType>({
      default: {
        body: JSON.stringify(
          {
            header: {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            },
            payload: [
              {
                example: 'This is is an example payload'
              }
            ]
          },
          null,
          2
        )
      }
    })
  });

  parseBody(bodyStr: string) {
    try {
      const body = JSON.parse(bodyStr);
      if (Array.isArray(body.payload)) {
        return {
          events: body.payload.map((item) => ({
            header: body.header,
            payload: typeof item == 'string' ? helper.stringToBase64(item) : helper.stringToBase64(JSON.stringify(item))
          }))
        };
      }

      if (body.payload) {
        return {
          events: [
            {
              header: body.header,
              payload: helper.stringToBase64(body.payload)
            }
          ]
        };
      }

      return {
        events: [
          {
            header: body.header,
            payload: helper.stringToBase64('')
          }
        ]
      };
    } catch (error) {
      return {
        events: [
          {
            header: {
              event_type: 'ANY',
              pub_id: '',
              token: '',
              pub_time: Date.now()
            },
            payload: helper.stringToBase64('')
          }
        ]
      };
    }
  }

  showPublishEventRequestTemplates = false;

  table = new JSONSchemaTableState<PublisherType>({
    columns: [
      {
        key: 'f_key',
        label: 'Publisher Key'
      },
      {
        key: 'f_token',
        label: 'token',
        render: PublisherTokenRender
      },
      {
        key: 'actions',
        label: 'Actions',
        actions: (item) => {
          return [
            {
              props: {
                bg: '#946FFF',
                color: '#fff',
                size: 'xs',
                onClick: async () => {
                  if (globalThis.store.w3s.config.form.formData.accountRole === 'DEVELOPER') {
                    this.createPublisherForm.uiSchema.projectName = {
                      'ui:disabled': true
                    };
                  }
                  this.createPublisherForm.value.set({
                    projectName: item.project_name,
                    key: item.f_key
                  });
                  const formData = await hooks.getFormData({
                    title: 'Edit Publisher',
                    size: 'md',
                    formList: [
                      {
                        form: this.createPublisherForm
                      }
                    ]
                  });
                  const { projectName, key } = formData;
                  if (projectName && key) {
                    try {
                      await axios.request({
                        method: 'put',
                        url: `/api/w3bapp/publisher/${projectName}/${item.f_publisher_id}`,
                        data: {
                          key,
                          name: key
                        }
                      });
                      await showNotification({ message: 'update publisher succeeded' });
                      eventBus.emit('publisher.update');
                    } catch (error) {}
                  }
                }
              },
              text: 'Edit'
            },
            {
              props: {
                ml: '8px',
                size: 'xs',
                ...defaultOutlineButtonStyle,
                onClick() {
                  globalThis.store.base.confirm.show({
                    title: 'Warning',
                    description: 'Are you sure you want to delete it?',
                    async onOk() {
                      await axios.request({
                        method: 'delete',
                        url: `/api/w3bapp/publisher/${item.project_name}?publisherID=${item.f_publisher_id}`
                      });
                      await showNotification({ message: 'Deleted successfully' });
                      eventBus.emit('strategy.delete');
                    }
                  });
                }
              },
              text: 'Delete'
            }
          ];
        }
      }
    ],
    rowKey: 'f_publisher_id',
    containerProps: { mt: '10px' }
  });

  allData: PublisherType[] = [];

  constructor() {
    makeObservable(this, {
      showPublishEventRequestTemplates: observable
    });
  }

  set(v: Partial<PublisherModule>) {
    Object.assign(this, v);
  }
}

import { JSONSchemaFormState, JSONValue } from '@/store/standard/JSONSchemaState';
import { FromSchema } from 'json-schema-to-ts';
import { UiSchema } from '@rjsf/utils';
import EditorWidget, { EditorWidgetUIOptions } from '@/components/JSONFormWidgets/EditorWidget';
import { StdIOType, WASM } from '@/server/wasmvm';
import { makeObservable, observable } from 'mobx';
import { compileAssemblyscript } from '@/components/IDE/Editor';
import toast from 'react-hot-toast';
import { StorageState } from '@/store/standard/StorageState';
import FileWidget from '@/components/JSONFormWidgets/FileWidget';
import { eventBus } from '@/lib/event';

export const uploadWasmTemplateFormSchema = {
  type: 'object',
  properties: {
    file: { type: 'string', title: 'Upload File' }
  },
  required: ['file']
} as const;
type UploadWasmTemplateFormSchemaType = FromSchema<typeof uploadWasmTemplateFormSchema>;

export const simulationEventSchema = {
  type: 'object',
  properties: {
    wasmPayload: { type: 'string', title: '' }
  },
  required: []
} as const;

type SimulationEventSchemaType = FromSchema<typeof simulationEventSchema>;

export default class LabModule {
  simulationEventForm = new JSONSchemaFormState<SimulationEventSchemaType, UiSchema & { wasmPayload: EditorWidgetUIOptions }>({
    //@ts-ignore
    schema: simulationEventSchema,
    uiSchema: {
      'ui:submitButtonOptions': {
        norender: false,
        submitText: 'Submit'
      },
      wasmPayload: {
        'ui:widget': EditorWidget,
        'ui:options': {
          editorHeight: '400px',
          showLanguageSelector: false
        }
      }
    },
    value: new JSONValue<SimulationEventSchemaType>({
      default: {
        wasmPayload: JSON.stringify({}, null, 2)
      }
    })
  });

  stdout: StdIOType[] = [];
  stderr: StdIOType[] = [];
  payloadCache: StorageState<string>;

  uploadWasmForm = new JSONSchemaFormState<UploadWasmTemplateFormSchemaType>({
    //@ts-ignore
    schema: uploadWasmTemplateFormSchema,
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
          tips: `Code Upload`,
          flexProps: {
            h: '200px',
            borderRadius: '8px'
          }
        }
      }
    },
    afterSubmit: async (e) => {
      eventBus.emit('base.formModal.afterSubmit', e.formData);
      this.uploadWasmForm.reset();
    },
    value: new JSONValue<UploadWasmTemplateFormSchemaType>({
      default: {
        file: ''
      }
    })
  });

  constructor() {
    makeObservable(this, {
      stdout: observable,
      stderr: observable
    });
  }

  async onDebugWASM(wasmPayload: Uint8Array, needCompile = true) {
    const { curFilesListSchema } = globalThis.store.w3s.projectManager;
    let buffer;
    if (needCompile) {
      const { error, binary, text, stats } = await compileAssemblyscript(curFilesListSchema.curActiveFile.data?.code);
      if (error) {
        return toast.error(error.message);
      }
      buffer = Buffer.from(binary);
    } else {
      buffer = Buffer.from(curFilesListSchema.curActiveFile.data?.extraData?.raw);
    }

    const wasi = new WASM(buffer);
    wasi.sendEvent(JSON.stringify(wasmPayload));
    this.payloadCache = new StorageState<string>({
      key: curFilesListSchema.curActiveFile.key + '_payload'
    });
    this.payloadCache.save(JSON.stringify(wasmPayload));
    const { stderr, stdout } = await wasi.start();
    this.stdout = this.stdout.concat(stdout ?? []);
    this.stdout = this.stdout.concat(stderr ?? []);
  }
}

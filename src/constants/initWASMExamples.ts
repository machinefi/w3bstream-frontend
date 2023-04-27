import { FilesItemType } from '@/store/lib/w3bstream/schema/filesList';
import { v4 as uuidv4 } from 'uuid';
import { templatecode } from './templatecode';
// case "INT":
//   return DATATYPE__INT, nil
// case "INT8":
//   return DATATYPE__INT8, nil
// case "INT16":
//   return DATATYPE__INT16, nil
// case "INT32":
//   return DATATYPE__INT32, nil
// case "INT64":
//   return DATATYPE__INT64, nil
// case "UINT":
//   return DATATYPE__UINT, nil
// case "UINT8":
//   return DATATYPE__UINT8, nil
// case "UINT16":
//   return DATATYPE__UINT16, nil
// case "UINT32":
//   return DATATYPE__UINT32, nil
// case "UINT64":
//   return DATATYPE__UINT64, nil
// case "FLOAT32":
//   return DATATYPE__FLOAT32, nil
// case "FLOAT64":
//   return DATATYPE__FLOAT64, nil
// case "TEXT":
//   return DATATYPE__TEXT, nil
// case "BOOL":
//   return DATATYPE__BOOL, nil
// case "TIMESTAMP":
//   return DATATYPE__TIMESTAMP, nil
// }

export const assemblyScriptExample: FilesItemType = {
  type: 'folder',
  key: uuidv4(),
  label: `.examples`,
  children: [
    {
      type: 'file',
      key: uuidv4(),
      label: `json.ts`,
      data: {
        dataType: 'assemblyscript',
        code: templatecode['json.ts'],
        language: 'typescript',
        extraData: {
          payload: {
            employees: {
              employee: [
                { id: '1', firstName: 'Tom', lastName: 'Cruise', photo: 'https://jsonformatter.org/img/tom-cruise.jpg' },
                { id: '2', firstName: 'Maria', lastName: 'Sharapova', photo: 'https://jsonformatter.org/img/Maria-Sharapova.jpg' },
                { id: '3', firstName: 'Robert', lastName: 'Downey Jr.', photo: 'https://jsonformatter.org/img/Robert-Downey-Jr.jpg' }
              ]
            }
          }
        }
      }
    },
    {
      type: 'file',
      key: uuidv4(),
      label: `log.ts`,
      data: { dataType: 'assemblyscript', code: templatecode['log.ts'], language: 'typescript' }
    },
    {
      type: 'file',
      key: uuidv4(),
      label: `sendTx.ts`,
      data: { dataType: 'assemblyscript', code: templatecode['sendTx.ts'], language: 'typescript' }
    },
    {
      type: 'file',
      key: uuidv4(),
      label: `setDB.ts`,
      data: { dataType: 'assemblyscript', code: templatecode['setDB.ts'], language: 'typescript' }
    },
    {
      type: 'file',
      key: uuidv4(),
      label: `sql.ts`,
      data: { dataType: 'assemblyscript', code: templatecode['sql.ts'], language: 'typescript' }
    },
    {
      type: 'file',
      key: uuidv4(),
      label: `env.ts`,
      data: { dataType: 'assemblyscript', code: templatecode['env.ts'], language: 'typescript' }
    }
  ]
};

export const flowExample: FilesItemType = {
  type: 'folder',
  key: uuidv4(),
  label: `Examples`,
  children: [
    {
      type: 'file',
      key: uuidv4(),
      label: `basic.flow`,
      data: {
        dataType: 'flow',
        nodes: [
          {
            id: '1682491671393',
            type: 'SimulationNode',
            position: { x: 107, y: 358 },
            data: {
              label: 'Simulation',
              code: '\n//https://github.com/faker-js/faker\nfunction createRandomUser() {\n  return {\n    userId: faker.datatype.uuid(),\n    username: faker.internet.userName(),\n    email: faker.internet.email(),\n    avatar: faker.image.avatar(),\n    password: faker.internet.password(),\n    birthdate: faker.date.birthdate(),\n    registeredAt: faker.date.past(),\n  };\n}\n\nreturn faker.helpers.multiple(createRandomUser, {\n  count: 5,\n});\n\n',
              triggerInterval: '2'
            }
          },
          { id: '1682491679529', type: 'VmRunTimeNode', position: { x: 1148, y: 346 }, data: { label: 'VM runtime', handler: 'start' } },
          {
            id: '1682491683609',
            type: 'AssemblyScriptNode',
            position: { x: 622, y: 425 },
            data: {
              label: 'AssemblyScript',
              code: '\nexport function start(rid: i32): i32 {\n  Log("start from typescript");\n  const message = GetDataByRID(rid);\n  Log("wasm received message:" + message);\n  return 0;\n}\n'
            }
          }
        ],
        edges: [
          {
            source: '1682491683609',
            sourceHandle: 'variable-source',
            target: '1682491679529',
            targetHandle: 'variable-target-wasm',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
            id: 'reactflow__edge-1682491683609variable-source-1682491679529variable-target-wasm'
          },
          {
            source: '1682491671393',
            sourceHandle: 'flow-source',
            target: '1682491679529',
            targetHandle: 'flow-target',
            animated: true,
            markerEnd: { type: 'arrowclosed' },
            id: 'reactflow__edge-1682491671393flow-source-1682491679529flow-target'
          }
        ]
      }
    }
  ]
};

export const SqlExample: FilesItemType = {
  type: 'folder',
  key: uuidv4(),
  label: `Examples`,
  children: [
    {
      type: 'file',
      key: uuidv4(),
      label: `sql.json`,
      data: {
        dataType: 'sql',
        code: JSON.stringify(
          [
            {
              name: 't_log',
              desc: 'test table',
              cols: [
                {
                  name: 'number',
                  constrains: {
                    datatype: 'UIN8',
                    length: 255,
                    desc: 'number'
                  }
                },
                {
                  name: 'text',
                  constrains: {
                    datatype: 'TEXT',
                    length: 255,
                    default: '0',
                    desc: 'text'
                  }
                },
                {
                  name: 'boolean',
                  constrains: {
                    datatype: 'BOOL',
                    length: 0,
                    desc: ''
                  }
                }
              ],
              keys: [
                {
                  name: 'ui_username',
                  isUnique: true,
                  columnNames: ['number']
                }
              ],
              withSoftDeletion: true,
              withPrimaryKey: true
            }
          ],
          null,
          2
        ),
        language: 'json'
      }
    }
  ]
};

export const simulationExample: FilesItemType = {
  type: 'folder',
  key: uuidv4(),
  label: `Examples`,
  children: [
    {
      type: 'file',
      key: uuidv4(),
      label: `iot-simulate.ts`,
      data: {
        dataType: 'simulation',
        language: 'typescript',
        code: `
//https://github.com/faker-js/faker
function createRandomUser() {
  return {
    snr: faker.number.int(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    gasResistance: faker.number.int(),
    temperature: faker.number.int({max:100,min:10}),
    light: faker.number.int(),
    random: faker.datatype.uuid()
  };
}

return faker.helpers.multiple(createRandomUser, {
  count: 1,
});
      
`
      }
    }
  ]
};

export const envExample: FilesItemType = {
  type: 'folder',
  key: uuidv4(),
  label: `ENV`,
  children: [
    {
      type: 'file',
      key: uuidv4(),
      label: `.env`,
      data: {
        dataType: 'env',
        code: `MY_ENV=this is my env`,
        language: 'env'
      }
    }
  ]
};

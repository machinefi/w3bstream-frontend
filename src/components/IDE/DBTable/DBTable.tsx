import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/index';
import { Box, Button, Flex, Stack, Image, Spinner, Text } from '@chakra-ui/react';
import JSONTable from '@/components/JSONTable';
import { useEffect, useRef } from 'react';
import { defaultButtonStyle, defaultOutlineButtonStyle } from '@/lib/theme';
import { MdRefresh } from 'react-icons/md';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { FiUpload } from 'react-icons/fi';
import { hooks } from '@/lib/hooks';
import { creatColumnDataForm } from '@/store/lib/w3bstream/schema/dbTable';
import MonacoEditor from '@monaco-editor/react';
import { _ } from '@/lib/lodash';
import CSVReader from 'react-csv-reader';
import toast from 'react-hot-toast';
import { formatColumn } from '@/postgres-meta/helpers';

const EditTable = observer(() => {
  const {
    base: { confirm },
    lang: { t },
    w3s: {
      dbTable,
      dbTable: { currentColumns }
    }
  } = useStore();

  if (!dbTable.currentTable.tableName) {
    return null;
  }

  return (
    <Box>
      <Flex alignItems="center">
        <Button h="32px" size="sm" leftIcon={<MdRefresh />} {...defaultOutlineButtonStyle} onClick={async (e) => { }}>
          Refresh
        </Button>
      </Flex>
      <Box mt="30px">
        <Box fontWeight={600} fontSize="md">
          Columns
        </Box>
        <Stack mt="10px" pl="20px">
          <Flex mb="5px" h="30px" alignItems="center">
            <Box ml="65px" w="250px" fontWeight={600} fontSize="sm">
              Name
            </Box>
            <Box ml="10px" w="250px" fontWeight={600} fontSize="sm">
              Type
            </Box>
            <Box ml="10px" w="200px" fontWeight={600} fontSize="sm">
              Default Value
            </Box>
          </Flex>
          {currentColumns.map((column) => {
            return (
              <Flex key={column.id} h="30px" alignItems="center">
                <DeleteIcon
                  ml="12px"
                  boxSize={4}
                  color="#946FFF"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirm.show({
                      title: `Confirm deletion of column "${column.name}"`,
                      description: 'Are you sure you want to delete the selected column?',
                      async onOk() {
                        dbTable.deleteColumn({
                          columnId: column.id,
                          cascade: true
                        });
                      }
                    });
                  }}
                />
                <EditIcon
                  ml="12px"
                  boxSize={4}
                  color="#946FFF"
                  cursor="pointer"
                  onClick={async (e) => {
                    e.stopPropagation();
                    dbTable.setCurrentWidgetColumn({
                      name: column.name,
                      type: column.format,
                      // @ts-ignore
                      defaultValue: column.default_value,
                      isUnique: column.is_unique,
                      isNullable: column.is_nullable,
                      isIdentity: column.is_identity,
                      isPrimaryKey: column.is_identity
                    });
                    const formData = await hooks.getFormData({
                      title: `Update column '${column.name}'  from  '${column.table}'`,
                      size: '6xl',
                      formList: [
                        {
                          form: dbTable.columnForm
                        }
                      ]
                    });
                    const { currentWidgetColumn } = dbTable;
                    if (currentWidgetColumn.name && currentWidgetColumn.type) {
                      const columnData = formatColumn(currentWidgetColumn);
                      if (formData.comment) {
                        columnData.comment = formData.comment;
                      } else {
                        delete columnData.comment;
                      }
                      const errorMsg = await dbTable.updateColumn(column.id, columnData);
                      if (!errorMsg) {
                        const cols = await dbTable.getCurrentTableCols();
                        dbTable.setCurrentColumns(cols);
                      }
                    }
                  }}
                />
                <Box ml="10px" w="250px" fontWeight={400} fontSize="sm">
                  {column.name}
                </Box>
                <Box ml="10px" w="250px" fontWeight={400} fontSize="sm">
                  {column.data_type}
                </Box>
                <Box ml="10px" w="200px" fontWeight={400} fontSize="sm">
                  {column.default_value}
                </Box>
              </Flex>
            );
          })}
          <Button
            w="100px"
            size="sm"
            {...defaultOutlineButtonStyle}
            leftIcon={<AddIcon />}
            onClick={async () => {
              dbTable.setCurrentWidgetColumn({
                id: '-',
                name: '',
                type: '',
                defaultValue: '',
                isPrimaryKey: false,
                isUnique: false,
                isNullable: true,
                isIdentity: false,
                isDefineASArray: false
              });
              const formData = await hooks.getFormData({
                title: `Add new column to '${dbTable.currentTable.tableName}'`,
                size: '6xl',
                formList: [
                  {
                    form: dbTable.columnForm
                  }
                ]
              });
              const { currentWidgetColumn } = dbTable;
              if (currentWidgetColumn.name && currentWidgetColumn.type) {
                const columnData = formatColumn(currentWidgetColumn);
                if (formData.comment) {
                  columnData.comment = formData.comment;
                } else {
                  delete columnData.comment;
                }
                const errorMsg = await dbTable.addColumn(dbTable.currentTable.tableId, columnData);
                if (!errorMsg) {
                  const cols = await dbTable.getCurrentTableCols();
                  dbTable.setCurrentColumns(cols);
                }
              }
            }}
          >
            Insert
          </Button>
        </Stack>
      </Box>
    </Box>
  );
});

const ViewData = observer(() => {
  const {
    w3s: { dbTable },
    lang: { t }
  } = useStore();

  if (!dbTable.currentTable.tableName) {
    return null;
  }

  return (
    <>
      <Flex alignItems="center">
        <Button
          mr="20px"
          h="32px"
          size="sm"
          leftIcon={<AddIcon />}
          {...defaultButtonStyle}
          onClick={async (e) => {
            const form = creatColumnDataForm(dbTable.currentColumns);
            const formData = await hooks.getFormData({
              title: `Insert data to '${dbTable.currentTable.tableName}'`,
              size: 'md',
              formList: [
                {
                  form
                }
              ]
            });
            try {
              const keys = Object.keys(formData);
              const values = Object.values(formData);
              const errorMsg = await dbTable.createTableData(keys, values);
              if (!errorMsg) {
                const data = await dbTable.getCurrentTableData.call();
                dbTable.table.set({
                  dataSource: data
                });
              }
            } catch (error) { }
          }}
        >
          Insert
        </Button>
        <label>
          <CSVReader
            label=""
            onFileLoaded={async (csvData) => {
              if (csvData?.length) {
                const keys = Object.keys(csvData[0]);
                let errorMsg = '';
                for (const item of csvData) {
                  const values = Object.values(item);
                  errorMsg = await dbTable.createTableData(keys, values);
                  if (errorMsg) {
                    break;
                  }
                }
                if (errorMsg) {
                  toast.error(errorMsg);
                } else {
                  const data = await dbTable.getCurrentTableData.call();
                  dbTable.table.set({
                    dataSource: data
                  });
                  toast.success(t('success.upload.msg'));
                }
              } else {
                toast.error(t('error.csvfile.empty.msg'));
              }
              (document.getElementById('csv-input') as HTMLInputElement).value = '';
            }}
            onError={(error) => {
              toast.error(error.message);
            }}
            parserOptions={{
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true
              // transformHeader: (header) => header.toLowerCase().replace(/\W/g, '_')
            }}
            inputId="csv-input"
            inputName="csv-input"
            inputStyle={{ display: 'none' }}
          />
          <Flex alignItems="center" px="10px" h="32px" borderRadius="6px" cursor="pointer" {...defaultButtonStyle}>
            <FiUpload />
            <Text ml="10px" fontSize="12px" fontWeight={600}>Upload CSV</Text>
          </Flex>
        </label>
        <Button
          ml="20px"
          h="32px"
          size="sm"
          leftIcon={<MdRefresh />}
          {...defaultOutlineButtonStyle}
          onClick={async (e) => {
            dbTable.init.call();
          }}
        >
          Refresh
        </Button>
      </Flex>
      <JSONTable jsonstate={dbTable} />
    </>
  );
});

const QuerySQL = observer(() => {
  const {
    w3s: { dbTable }
  } = useStore();

  const changeCodeRef = useRef(
    _.debounce((codeStr: string) => {
      dbTable.setSQL(codeStr);
    }, 800)
  );

  return (
    <Box bg="#000">
      <Box p="1" fontSize="sm" fontWeight={700} color="#fff">
        SQL:
      </Box>
      <Box pos="relative">
        <MonacoEditor
          options={{
            minimap: {
              enabled: false
            }
          }}
          height={300}
          theme="vs-dark"
          language={'sql'}
          value={dbTable.sql}
          onChange={(v) => {
            changeCodeRef.current && changeCodeRef.current(v);
          }}
        />
        <Box
          pos="absolute"
          bottom={1}
          right={4}
          cursor="pointer"
          onClick={() => {
            if (dbTable.querySQL.loading.value) {
              return;
            }
            dbTable.querySQL.call();
          }}
        >
          {
            dbTable.querySQL.loading.value
              ? <Spinner size="sm" color='#fff' />
              : <Image p={1} h={6} w={6} borderRadius="4px" bg="#946FFF" _hover={{ background: 'gray.200' }} src="/images/icons/execute.svg" />
          }
        </Box>
      </Box>
      <Box p="1" fontSize="sm" fontWeight={700} color="#fff">
        Query Result:
      </Box>
      <MonacoEditor
        options={{
          readOnly: true,
          minimap: {
            enabled: false
          }
        }}
        height="calc(100vh - 480px)"
        theme="vs-dark"
        language="json"
        value={dbTable.querySQL.value}
      />
    </Box>
  );
});

const DBTable = observer(() => {
  const {
    w3s: { dbTable }
  } = useStore();

  useEffect(() => {
    dbTable.init.call();
  }, [dbTable.currentTable.tableSchema, dbTable.currentTable.tableName]);

  useEffect(() => {
    return () => {
      dbTable.setCurrentTable({
        tableId: 0,
        tableSchema: '',
        tableName: ''
      });
    };
  }, []);

  return (
    <>
      {dbTable.mode === 'EDIT_TABLE' && <EditTable />}
      {dbTable.mode === 'VIEW_DATA' && <ViewData />}
      {dbTable.mode === 'QUERY_SQL' && <QuerySQL />}
    </>
  );
});

export default DBTable;

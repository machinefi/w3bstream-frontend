import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Center, Table as ChakraTable, TableContainer, Tbody, Td, Th, Thead, Tr, useDisclosure, Text } from '@chakra-ui/react';
import SimplePagination from '../Common/SimplePagination';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { ActionButtonType, Column, ExtendedTable, JSONSchemaTableState } from '@/store/standard/JSONSchemaState';

export interface JSONTableProps<T> {
  jsonstate: {
    table: JSONSchemaTableState<T>;
  };
}

const JSONTable = observer(<T,>(props: JSONTableProps<T>) => {
  const { columns, dataSource, rowKey, extendedTables = [], pagination, isServerPaging, containerProps = {} } = props.jsonstate.table;

  useEffect(() => {
    if (!isServerPaging) {
      pagination.setData({
        total: dataSource.length
      });
    }
  }, [dataSource, isServerPaging]);

  const needExtendedTable = !!extendedTables.length;

  const data = isServerPaging ? dataSource : dataSource.slice(pagination.offset, pagination.offset + pagination.limit);

  return (
    <>
      <TableContainer {...containerProps} overflowX="auto">
        <ChakraTable>
          <Thead>
            <Tr bg="#F5F5F5">
              {needExtendedTable && <Th></Th>}
              {columns.map((item) => (
                <Th key={item.key} textTransform="none">
                  <Text fontSize="14px" fontWeight={400} color="blackAlpha.800">
                    {item.label}
                  </Text>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, index) =>
              needExtendedTable ? (
                <CollapseBody key={item[rowKey] || index} item={item} columns={columns} extendedTables={extendedTables} />
              ) : (
                <Body key={item[rowKey] || index} item={item} columns={columns} />
              )
            )}
          </Tbody>
        </ChakraTable>
        {pagination.total == 0 && (
          <Center mt="20px" fontSize={'14px'} color="#7a7a7a">
            No Data
          </Center>
        )}
      </TableContainer>
      {pagination.total > pagination.limit && (
        <SimplePagination
          mt="10px"
          total={pagination.total}
          limit={pagination.limit}
          page={pagination.page}
          onPageChange={(currentPage) => {
            pagination.setData({
              page: currentPage
            });
          }}
        />
      )}
    </>
  );
});

function ActionButton({ props, text }: ActionButtonType) {
  return (
    <Button
      h="32px"
      _hover={{ opacity: 0.8 }}
      _active={{
        opacity: 0.6
      }}
      {...props}
    >
      {text}
    </Button>
  );
}

function renderFieldValue(v: any) {
  if (typeof v == 'string' || typeof v == 'number') {
    return v;
  }
  return JSON.stringify(v);
}

function Body<T>({ item, columns }: { item: T; columns: Column<T>[] }) {
  return (
    <Tr fontSize="14px" color="#0F0F0F">
      {columns.map((column) => {
        return (
          <Td key={column.key} fontSize={'12px'} border="1px solid #F5F5F5" maxW="200px" overflowX="auto">
            {column.actions
              ? column.actions(item).map((btn, index) => <ActionButton key={index} props={btn.props} text={btn.text} />)
              : column.render
              ? column.render(item)
              : renderFieldValue(item[column.key])}
          </Td>
        );
      })}
    </Tr>
  );
}

function CollapseBody<T>({ item, columns, extendedTables }: { item: T; columns: Column<T>[]; extendedTables: ExtendedTable<any>[] }) {
  const { isOpen, onToggle } = useDisclosure();
  const styles = isOpen ? { display: 'table-row' } : { display: 'none' };

  return (
    <>
      <Tr
        fontSize="14px"
        color="#0F0F0F"
        cursor="pointer"
        onClick={(e: any) => {
          const { nodeName } = e.target;
          if (nodeName === 'TD' || nodeName === 'svg') {
            onToggle();
          }
        }}
      >
        <Td w="40px">{isOpen ? <ChevronDownIcon w={6} h={6} /> : <ChevronRightIcon w={6} h={6} />}</Td>
        {columns.map((column) => {
          return (
            <Td key={column.key} border="1px solid #F5F5F5" maxW="200px" overflowX="auto">
              {column.actions
                ? column.actions(item).map((btn, index) => <ActionButton key={index} props={btn.props} text={btn.text} />)
                : column.render
                ? column.render(item)
                : renderFieldValue(item[column.key])}
            </Td>
          );
        })}
      </Tr>
      <Tr {...styles}>
        <Td></Td>
        <Td colSpan={columns.length}>
          {extendedTables.map((ex) => {
            const exColumns = ex.columns;
            const exRow = item[ex.key];
            return (
              <TableContainer mb="10px">
                <ChakraTable>
                  <Thead>
                    <Tr bg="#F5F5F5">
                      {exColumns.map((exC) => {
                        return (
                          <Th key={exC.key} fontSize="14px" fontWeight={400} color="#0F0F0F" textTransform="none">
                            {exC.label}
                          </Th>
                        );
                      })}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {exRow.map((exItem) => (
                      <Tr fontSize="14px" color="#0F0F0F">
                        {exColumns.map((exC) => {
                          return (
                            <Td key={exC.key} border="1px solid #F5F5F5" maxW="200px" overflowX="auto">
                              {exC.actions
                                ? exC.actions(exItem).map((btn, index) => <ActionButton key={index} props={btn.props} text={btn.text} />)
                                : exC.render
                                ? exC.render(exItem)
                                : renderFieldValue(exItem[exC.key])}
                            </Td>
                          );
                        })}
                      </Tr>
                    ))}
                  </Tbody>
                </ChakraTable>
              </TableContainer>
            );
          })}
        </Td>
      </Tr>
    </>
  );
}

export default JSONTable;

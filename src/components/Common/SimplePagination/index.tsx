import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Flex, FlexProps } from '@chakra-ui/react';
import Pagination from 'rc-pagination';

interface SimplePaginationProps extends FlexProps {
  total: number;
  limit: number;
  page: number;
  onPageChange: (currentPage: number) => void;
}

const itemRender = (current, type, element) => {
  if (type === 'prev') {
    return (
      <Flex w="30px" h="30px" justifyContent="center" alignItems="center" mr="10px" bg="#946FFF" color="#fff" cursor="pointer" borderRadius="4px">
        <ChevronLeftIcon />
      </Flex>
    );
  }
  if (type === 'next') {
    return (
      <Flex w="30px" h="30px" justifyContent="center" alignItems="center" ml="10px" bg="#946FFF" color="#fff" cursor="pointer" borderRadius="4px">
        <ChevronRightIcon />
      </Flex>
    );
  }
  return element;
};

const SimplePagination = ({ total, limit, page, onPageChange, ...props }: SimplePaginationProps) => {
  return (
    <Flex
      justifyContent="center"
      sx={{
        '.rc-pagination-simple': {
          display: 'flex',
          alignItems: 'center',
          listStyle: 'none'
        },
        '.rc-pagination-simple-pager >input': {
          width: '20px',
          height: '20px',
          bg: 'rgba(148, 111, 255, 0.1)',
          color: '#000',
          lineHeight: '30px',
          textAlign: 'center',
          outline: 'none'
        },
        '.rc-pagination-simple-pager > span': {
          marginLeft: '10px',
          marginRight: '10px'
        }
      }}
      {...props}
    >
      <Pagination
        simple
        total={total}
        pageSize={limit}
        current={page}
        itemRender={itemRender}
        onChange={(currentPage) => {
          if (currentPage) {
            onPageChange?.(currentPage);
          }
        }}
      />
    </Flex>
  );
};

export default SimplePagination;

import React from 'react';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { isEmpty } from 'lodash';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface Props {
  data: any;
  columns: ColumnDef<any, any>[];
}

const CustomTable = (props?: Props) => {
  const { data, columns } = props || {};

  const table = useReactTable({
    data,
    columns: columns!,
    getCoreRowModel: getCoreRowModel(),
  });

  return isEmpty(data) ? (
    <>Loading...</>
  ) : (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    backgroundColor: '#1976D2',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableCell>
              )),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.getRowModel().rows?.map((row) => (
            <TableRow key={row?.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomTable;

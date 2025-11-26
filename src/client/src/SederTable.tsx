import { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from 'material-react-table';

type TranslationsApiResponse = {
  allKeys: string[];
  mainLang: string;
  translations: Translation;
};

type Translation = Record<string, Record<string, string>>;

const LOCAL = 'http://localhost:3124';

const SederTable = () => {

  const [data, setData] = useState<{key: string}[]>([]);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!data.length) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }

      const url = new URL('/api/translations', LOCAL);

      try {
        console.log({url});
        
        const response = await fetch(url.href);
        const json = (await response.json()) as TranslationsApiResponse;
        const languages = Object.keys(json.translations);
        const translationsArray = json.allKeys.map((key) => ({
          key,
          ...languages.reduce((acc, lang) => {
            acc[lang] = json.translations[lang][key] || '';
            return acc;
          }, {} as Record<string, string>),
        }))
        setData(translationsArray);
        setRowCount(translationsArray.length);
        console.log({translationsArray});
        
      } catch (error) {
        setIsError(true);
        console.error(error);
        return;
      }
      setIsError(false);
      setIsLoading(false);
      setIsRefetching(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    columnFilters, //re-fetch when column filters change
    globalFilter, //re-fetch when global filter changes
  ]);

  const columns = useMemo<MRT_ColumnDef<{key: string}>[]>(
    () => data.length ? Object.keys(data[0]).map((translationkeys, index) => ({
        accessorKey: translationkeys,
        header: translationkeys,
        enableEditing: index !== 0,
        muiEditTextFieldProps: {
          error: !!validationErrors[translationkeys],
          helperText: validationErrors[translationkeys],
          //remove any previous validation errors when user focuses on the input
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              [translationkeys]: undefined,
            }),
          //optionally add validation checking for onBlur or onChange
        },
      })) : [],
    [data],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    enablePagination: false,
    rowCount,
    enableColumnPinning: true,
    enableRowActions: true,
    enableFullScreenToggle: false,
    layoutMode: 'grid-no-grow', //constant column widths
    createDisplayMode: 'modal', //default ('row', and 'custom' are also available)
    editDisplayMode: 'modal', //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => row.key,
    initialState: { showColumnFilters: true },
    muiToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    enableRowVirtualization: true,
    muiTableContainerProps: { sx: { maxHeight: '500px' } },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onShowColumnFiltersChange: setShowColumnFilters,
    onSortingChange: setSorting,
    muiEditRowDialogProps: {
      open: true,
      maxWidth: 'md',

    },
    onEditingRowSave: async ({ exitEditingMode, values }) => {
      console.log(values);
      const url = new URL('/api/update-translation', LOCAL);
      const { key, ...rest } = values;
      const data = {
        key: values.key,
        values: rest
      }
      const response = await fetch(url.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });

      if (!response.ok) {
        const errorData = await response.json();
        const newValidationErrors: Record<string, string> = {};
        if (errorData.errors) {
          for (const err of errorData.errors) {
            newValidationErrors[err.field] = err.message;
          }
          setValidationErrors(newValidationErrors);
        }
        throw new Error('Failed to update translation');
      }

      //clear validation errors on successful save
      setValidationErrors({});
      exitEditingMode();
    },
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      showColumnFilters: showColumnFilters,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
      sorting,
      isFullScreen: true,
      columnPinning: { left: ['mrt-row-actions', 'key'] }
    },
  });

  return <MaterialReactTable table={table} />;
};

export default SederTable;

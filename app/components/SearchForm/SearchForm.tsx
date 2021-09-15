import React from 'react';
import _ from 'lodash';
import { useForm, SubmitHandler, Controller, Control } from 'react-hook-form';

import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import clsx from 'clsx';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import TextField from '@material-ui/core/TextField';
import DateFnsUtils from '@date-io/date-fns';
import zhCN from 'date-fns/locale/zh-CN';
import {
  MuiPickersUtilsProvider,
  KeyboardDateTimePicker,
} from '@material-ui/pickers';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RotateLeftIcon from '@material-ui/icons/RotateLeft';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';
import { ConversationQueryInput } from 'app/domain/graphql/Conversation';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormControlProps,
} from '@material-ui/core';
import { CustomerQueryInput } from 'app/domain/graphql/Customer';
import ChipSelect, { SelectKeyValue } from '../Form/ChipSelect';

export const useSearchFormStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& > *': {
        margin: theme.spacing(1),
        width: '26ch',
      },
    },
    chip: {
      margin: 2,
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    button: {
      margin: theme.spacing(1),
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: '50vw',
      maxWidth: '100%',
    },
  })
);

type FormType = ConversationQueryInput | CustomerQueryInput;

interface FormProps {
  defaultValues: FormType;
  currentValues: FormType;
  selectKeyValueList: SelectKeyValue[];
  searchAction: (searchParams: FormType) => void;
  customerForm?: (control: Control<FormType>) => React.ReactNode;
}

const dateFnsUtils = new DateFnsUtils();

export default function SearchForm(props: FormProps) {
  const {
    defaultValues,
    currentValues,
    selectKeyValueList,
    searchAction,
    customerForm,
  } = props;
  const classes = useSearchFormStyles();
  const { handleSubmit, register, reset, control, getValues, setValue } =
    useForm<FormType>({ defaultValues: currentValues });
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDelete = (name: string, value: string) => {
    const values = getValues(name) as string[];
    setValue(
      name,
      _.remove(values, (v) => v !== value)
    );
  };

  const onSubmit: SubmitHandler<FormType> = (form) => {
    if (form.time) {
      searchAction(_.omit(form, 'time'));
    } else {
      searchAction(_.omit(form, 'time', 'timeRange'));
    }
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils} locale={zhCN}>
      <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        {/* 老式的折叠写法，新的参考 StaffShuntForm */}
        <Card>
          <CardActions disableSpacing>
            <div className={classes.root}>
              <TextField
                id="standard-basic"
                label="关键字"
                name="keyword"
                inputRef={register()}
              />
              <Controller
                control={control}
                defaultValue
                name="time"
                render={({ onChange, value }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        inputProps={{ 'aria-label': 'primary checkbox' }}
                      />
                    }
                    label="时间"
                  />
                )}
              />
              <Controller
                control={control}
                name="timeRange.from"
                render={({ onChange, value }) => (
                  <KeyboardDateTimePicker
                    disableFuture
                    variant="inline"
                    format="yyyy-MM-dd HH:mm:ss"
                    margin="normal"
                    id="date-picker-inline"
                    label="开始时间"
                    value={value}
                    onChange={(d) => {
                      if (d) {
                        onChange(
                          dateFnsUtils.format(d, "yyyy-MM-dd'T'HH:mm:ss.SSSXX")
                        );
                      }
                    }}
                    KeyboardButtonProps={{
                      'aria-label': 'change date',
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="timeRange.to"
                render={({ onChange, value }) => (
                  <KeyboardDateTimePicker
                    variant="inline"
                    format="yyyy-MM-dd HH:mm:ss"
                    margin="normal"
                    id="date-picker-inline"
                    label="结束时间"
                    value={value}
                    onChange={(d) => {
                      if (d) {
                        onChange(
                          dateFnsUtils.format(d, "yyyy-MM-dd'T'HH:mm:ss.SSSXX")
                        );
                      }
                    }}
                    KeyboardButtonProps={{
                      'aria-label': 'change date',
                    }}
                  />
                )}
              />
            </div>
            <Button
              variant="contained"
              color="secondary"
              className={classes.button}
              startIcon={<RotateLeftIcon />}
              aria-label="reset"
              onClick={() => {
                reset(defaultValues);
              }}
            >
              重置
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              className={classes.button}
              startIcon={<SearchIcon />}
              aria-label="submit"
            >
              搜索
            </Button>
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: expanded,
              })}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </IconButton>
          </CardActions>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardActions>
              {customerForm && customerForm(control)}
              <ChipSelect
                selectKeyValueList={selectKeyValueList}
                control={control}
                handleDelete={handleDelete}
                CustomerFormControl={(formControlProps: FormControlProps) => (
                  <FormControl
                    className={classes.formControl}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...formControlProps}
                  />
                )}
              />
            </CardActions>
          </Collapse>
        </Card>
      </form>
    </MuiPickersUtilsProvider>
  );
}
SearchForm.defaultProps = {
  customerForm: undefined,
};

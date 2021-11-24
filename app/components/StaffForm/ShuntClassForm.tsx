import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';

import { useMutation } from '@apollo/client';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import GroupIcon from '@material-ui/icons/Group';

import { ShuntClass, StaffGroup } from 'app/domain/StaffInfo';
import {
  SaveShuntClassGraphql,
  MUTATION_SHUNT_CLASS,
} from 'app/domain/graphql/Staff';
import useAlert from 'app/hook/alert/useAlert';
import SubmitButton from '../Form/SubmitButton';

const useStyles = makeStyles(() =>
  createStyles({
    paper: {
      // marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
  })
);

interface FormProps {
  defaultValues: ShuntClass | undefined;
}

export default function ShuntClassForm(props: FormProps) {
  const { defaultValues } = props;
  const classes = useStyles();
  const { handleSubmit, register } = useForm<StaffGroup>({
    defaultValues,
  });

  const { onLoadding, onCompleted, onError } = useAlert();
  const [saveShuntClass, { loading, data }] =
    useMutation<SaveShuntClassGraphql>(MUTATION_SHUNT_CLASS, {
      onCompleted,
      onError,
    });
  if (loading) {
    onLoadding(loading);
  }

  const onSubmit: SubmitHandler<StaffGroup> = (form) => {
    saveShuntClass({ variables: { staffGroupInput: form } });
  };

  return (
    <div className={classes.paper}>
      <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          value={defaultValues?.id || data?.saveShuntClass.id || ''}
          name="id"
          type="hidden"
          inputRef={register({ valueAsNumber: true })}
        />
        <TextField
          value={1}
          name="catalogue"
          type="hidden"
          inputRef={register({ valueAsNumber: true })}
        />
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          id="className"
          name="className"
          label="分类名称"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <GroupIcon />
              </InputAdornment>
            ),
          }}
          inputRef={register({
            required: '必须设置分类名称',
            maxLength: {
              value: 50,
              message: '分类名称不能大于50位',
            },
          })}
        />
        <SubmitButton />
      </form>
    </div>
  );
}
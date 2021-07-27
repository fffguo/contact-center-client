import React from 'react';
import _ from 'lodash';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { gql, useMutation } from '@apollo/client';

import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';

import {
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormControlProps,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';

import { makeTreeNode, Topic, TopicCategory } from 'app/domain/Bot';
import DropdownTreeSelect, { TreeNodeProps } from 'react-dropdown-tree-select';
import ChipSelect, { SelectKeyValue } from '../Form/ChipSelect';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      // marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
  })
);

interface FormProps {
  defaultValues: Topic | undefined;
  topicList: Topic[];
  categoryList: TopicCategory[];
}

interface Graphql {
  saveTopic: Topic;
}

const MUTATION_TOPIC = gql`
  mutation Staff($topicInput: TopicInput!) {
    saveTopic(topic: $topicInput) {
      id
      knowledgeBaseId
      question
      md5
      answer
      innerAnswer
      fromType
      type
      refId
      connectIds
      enabled
      effectiveTime
      failureTime
      categoryId
      faqType
    }
  }
`;

export default function TopicForm(props: FormProps) {
  const { defaultValues, topicList, categoryList } = props;
  const classes = useStyles();
  const {
    handleSubmit,
    register,
    control,
    watch,
    errors,
    getValues,
    setValue,
  } = useForm<Topic>({
    defaultValues,
  });

  const [saveTopic, { loading, data }] = useMutation<Graphql>(MUTATION_TOPIC);

  const onSubmit: SubmitHandler<Topic> = (form) => {
    saveTopic({ variables: { topicInput: form } });
  };

  const questionType = watch('type', 1);

  const selectKeyValueList: SelectKeyValue[] = [
    {
      label: '关联问题',
      name: 'connectIds',
      selectList: _.zipObject(
        topicList.map((it) => it.id ?? ''),
        topicList.map((it) => it.question)
      ),
      defaultValue: defaultValues?.connectIds ?? [],
    },
  ];

  const handleDelete = (name: string, value: string) => {
    const values = getValues(name) as string[];
    setValue(
      name,
      _.remove(values, (v) => v !== value)
    );
  };

  const currentValues = getValues();
  const treeData = makeTreeNode(
    categoryList,
    currentValues?.categoryId,
    (topicCategory: TopicCategory, node: TreeNodeProps) => {
      node.knowledgeBaseId = topicCategory.knowledgeBaseId;
    }
  );

  return (
    <div className={classes.paper}>
      <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          value={data?.saveTopic.id || currentValues?.id || ''}
          name="id"
          type="hidden"
          inputRef={register({ valueAsNumber: true })}
        />
        <TextField
          value={data?.saveTopic.categoryId || currentValues?.categoryId || ''}
          name="categoryId"
          type="hidden"
          error={errors.categoryId && true}
          helperText={errors.categoryId?.message}
          inputRef={register({
            required: '必须选择知识库分类',
            valueAsNumber: true,
          })}
        />
        <TextField
          value={
            data?.saveTopic.knowledgeBaseId ||
            currentValues?.knowledgeBaseId ||
            ''
          }
          name="knowledgeBaseId"
          type="hidden"
          inputRef={register({
            required: '必须选择知识库',
            valueAsNumber: true,
          })}
        />
        <FormControl variant="outlined" margin="normal" fullWidth>
          <DropdownTreeSelect
            inlineSearchInput
            data={treeData}
            onChange={(_currentNode, selectedNodes) => {
              setValue(
                'knowledgeBaseId',
                selectedNodes.map((it) => it.knowledgeBaseId)[0],
                {
                  shouldValidate: true,
                }
              );
              setValue('categoryId', selectedNodes.map((it) => it.value)[0], {
                shouldValidate: true,
              });
            }}
            texts={{ placeholder: '选择所属分类' }}
            className="mdl-demo"
            mode="radioSelect"
          />
        </FormControl>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          id="question"
          name="question"
          label="问题"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <QuestionAnswerIcon />
              </InputAdornment>
            ),
          }}
          error={errors.question && true}
          helperText={errors.question?.message}
          inputRef={register({
            required: '问题必填',
            maxLength: {
              value: 500,
              message: '问题长度不能大于500个字符',
            },
          })}
        />
        <Controller
          control={control}
          name="type"
          defaultValue={1}
          render={({ onChange, value }) => (
            <FormControl variant="outlined" margin="normal" fullWidth>
              <InputLabel id="demo-mutiple-chip-label">问题类型</InputLabel>
              <Select
                labelId="type"
                id="type"
                onChange={onChange}
                value={value}
                label="问题类型"
              >
                <MenuItem value={1}>标准问题</MenuItem>
                <MenuItem value={2}>相似问题</MenuItem>
              </Select>
            </FormControl>
          )}
        />
        {questionType === 1 && (
          <>
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="answer"
              name="answer"
              label="问题的对外答案"
              error={errors.answer && true}
              helperText={errors.answer?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QuestionAnswerIcon />
                  </InputAdornment>
                ),
              }}
              inputRef={register()}
            />
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="innerAnswer"
              name="innerAnswer"
              label="问题的对内答案"
              error={errors.innerAnswer && true}
              helperText={errors.innerAnswer?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QuestionAnswerIcon />
                  </InputAdornment>
                ),
              }}
              inputRef={register()}
            />
            <ChipSelect
              selectKeyValueList={selectKeyValueList}
              control={control}
              handleDelete={handleDelete}
              CustomerFormControl={(formControlProps: FormControlProps) => (
                <FormControl
                  variant="outlined"
                  margin="normal"
                  fullWidth
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...formControlProps}
                />
              )}
            />
          </>
        )}
        {questionType === 2 && (
          <Controller
            control={control}
            name="refId"
            rules={{ required: '相似问题必选' }}
            render={({ onChange, value }, { invalid }) => (
              <FormControl
                variant="outlined"
                margin="normal"
                fullWidth
                error={invalid}
              >
                <InputLabel id="demo-mutiple-chip-label">相似问题</InputLabel>
                <Select
                  labelId="refId"
                  id="refId"
                  onChange={onChange}
                  value={value || ''}
                  label="相似问题"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {topicList &&
                    topicList.map((it) => {
                      return (
                        <MenuItem key={it.id} value={it.id}>
                          {it.question}
                        </MenuItem>
                      );
                    })}
                </Select>
                {invalid && <FormHelperText>Error</FormHelperText>}
              </FormControl>
            )}
          />
        )}
        <Controller
          control={control}
          defaultValue
          name="enabled"
          render={({ onChange, value }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  inputProps={{ 'aria-label': 'primary checkbox' }}
                />
              }
              label="是否启用"
            />
          )}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
        >
          保存
        </Button>
      </form>
      {loading && <CircularProgress />}
      {data && <Typography>Success!</Typography>}
    </div>
  );
}

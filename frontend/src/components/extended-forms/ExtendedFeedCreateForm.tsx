import FeedCreateForm, { FeedCreateFormInputValues, FeedCreateFormProps } from '../../../ui-components/FeedCreateForm';

interface ExtendedFeedCreateFormProps extends Omit<FeedCreateFormProps, 'onSubmit'> {
  websiteId: string;
  onSubmit?: (fields: FeedCreateFormInputValues & { websiteId: string }) => FeedCreateFormInputValues & { websiteId: string };
}

export function ExtendedFeedCreateForm(props: ExtendedFeedCreateFormProps) {
  const { websiteId, onSubmit, ...rest } = props;

  const handleSubmit = (fields: FeedCreateFormInputValues) => {
    const updatedFields = {
      ...fields,
      websiteId: websiteId
    };
    return onSubmit ? onSubmit(updatedFields) : updatedFields;
  };

  return (
    <FeedCreateForm
      {...rest}
      onSubmit={handleSubmit}
    />
  );
}
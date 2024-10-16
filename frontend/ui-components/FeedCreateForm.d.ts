import * as React from "react";
import { GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type FeedCreateFormInputValues = {
    name?: string;
    url?: string;
    description?: string;
    type?: string;
    tags?: string[];
};
export declare type FeedCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    url?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    tags?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FeedCreateFormOverridesProps = {
    FeedCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    url?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<SelectFieldProps>;
    tags?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type FeedCreateFormProps = React.PropsWithChildren<{
    overrides?: FeedCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: FeedCreateFormInputValues) => FeedCreateFormInputValues;
    onSuccess?: (fields: FeedCreateFormInputValues) => void;
    onError?: (fields: FeedCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FeedCreateFormInputValues) => FeedCreateFormInputValues;
    onValidate?: FeedCreateFormValidationValues;
} & React.CSSProperties>;
export default function FeedCreateForm(props: FeedCreateFormProps): React.ReactElement;


//NEW
export type ExtendedFeedCreateFormProps = Omit<FeedCreateFormProps, 'onSubmit'> & {
    websiteId: string;
    onSubmit?: (fields: FeedCreateFormInputValues & { websiteId: string }) => FeedCreateFormInputValues & { websiteId: string };
  };

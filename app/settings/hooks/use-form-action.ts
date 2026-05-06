import { useActionState, useTransition } from "react";
import { useForm, FormProvider, type UseFormReturn, type FieldValues } from "react-hook-form";

interface UseFormActionProps<T extends FieldValues> {
  action: (prevState: any, formData: FormData) => Promise<any>;
  initialState: any;
  schema: any;
  defaultValues: T;
}

interface UseFormActionReturn<T extends FieldValues> {
  formState: any;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  methods: UseFormReturn<T>;
  FormProviderComponent: typeof FormProvider;
  onSubmit: () => void;
}

export function useFormAction<T extends FieldValues>({
  action,
  initialState,
  schema,
  defaultValues,
}: UseFormActionProps<T>): UseFormActionReturn<T> {
  const [state, formAction] = useActionState(action, initialState);
  const [isPending, startTransition] = useTransition();

  const methods = useForm<T>({
    // @ts-ignore - zodResolver type issue
    resolver: schema,
    defaultValues: defaultValues as any,
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value ?? ""));
    });
    startTransition(() => formAction(formData));
  });

  return {
    formState: state,
    formAction: (formData: FormData) => startTransition(() => formAction(formData)),
    isPending,
    methods,
    FormProviderComponent: FormProvider,
    onSubmit,
  };
}

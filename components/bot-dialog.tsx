"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { nanoid } from "nanoid"
import { ShuffleIcon } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { createBotSchema, type CreateBotInput } from "@/db/schema"

const JOB_SUGGESTIONS = [
  "Research assistant",
  "Code reviewer",
  "Writing editor",
  "Tutor",
]

export function BotDialog({ trigger }: { trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <BotForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Mounted only while the dialog is open, so every open starts with a fresh form.
function BotForm({ onDone }: { onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<CreateBotInput>({
    resolver: zodResolver(createBotSchema),
    defaultValues: { name: "", job: "", instructions: "", avatar: nanoid() },
  })

  const avatar = useWatch({ control: form.control, name: "avatar" })

  function onSubmit(values: CreateBotInput) {
    startTransition(async () => {
      const result = await createBot(values)
      if (!result.ok) {
        toast.add({ title: "Couldn't create bot", description: result.error })
        return
      }
      toast.add({ title: `${values.name} is ready` })
      onDone()
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
      <DialogHeader>
        <DialogTitle>New bot</DialogTitle>
        <DialogDescription>
          Give it a face, a name, and a job to do.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        {JOB_SUGGESTIONS.map((job) => (
          <Button
            key={job}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() =>
              form.setValue("job", job, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            {job}
          </Button>
        ))}
      </div>

      <FieldGroup>
        <div className="flex items-center gap-3">
          <ChatAvatar seed={avatar} className="size-12" />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">Face</span>
            <span className="text-sm text-muted-foreground">
              Shuffle until you find one you like.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.setValue("avatar", nanoid())}
          >
            <ShuffleIcon data-icon="inline-start" />
            Shuffle
          </Button>
        </div>

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-name">Name</FieldLabel>
              <Input
                {...field}
                id="bot-name"
                placeholder="Ada"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="job"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-job">Job</FieldLabel>
              <Input
                {...field}
                id="bot-job"
                placeholder="Research assistant"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="instructions"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="bot-instructions">
                How it should work
              </FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id="bot-instructions"
                placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                className="min-h-24"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          Create bot
        </Button>
      </DialogFooter>
    </form>
  )
}

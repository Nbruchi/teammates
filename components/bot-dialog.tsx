"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { nanoid } from "nanoid"
import { ShuffleIcon, Trash2Icon } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { createBot, deleteBot, updateBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  createBotSchema,
  type CreateBotInput,
  type UpdateBotInput,
} from "@/db/schema"

const JOB_SUGGESTIONS = [
  {
    job: "Research assistant",
    instructions:
      "Answer briefly, cite sources, and ask before running anything destructive.",
  },
  {
    job: "Code reviewer",
    instructions:
      "Review changes for correctness, security, and readability. Point to the exact lines, explain why each issue matters, and suggest a fix. Separate blocking problems from nitpicks, and don't rewrite code unless asked.",
  },
  {
    job: "Writing editor",
    instructions:
      "Improve clarity, flow, and tone while keeping my voice. Explain the biggest changes, flag anything unclear instead of guessing, and keep edits minimal unless I ask for a rewrite.",
  },
  {
    job: "Tutor",
    instructions:
      "Teach step by step at my level. Ask what I already know first, use examples, and check my understanding with short questions. Guide me to the answer instead of just giving it.",
  },
]

type BotDialogProps = {
  /** Element that opens the dialog. Omit it to control the dialog with `open`. */
  trigger?: React.ReactElement
  /** Edit this bot instead of creating a new one. */
  bot?: UpdateBotInput
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BotDialog({
  trigger,
  bot,
  open: openProp,
  onOpenChange,
}: BotDialogProps) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState

  function setOpen(next: boolean) {
    setOpenState(next)
    onOpenChange?.(next)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-lg">
        <BotForm bot={bot} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Mounted only while the dialog is open, so every open starts with a fresh form.
function BotForm({
  bot,
  onDone,
}: {
  bot?: UpdateBotInput
  onDone: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const form = useForm<CreateBotInput>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      name: bot?.name ?? "",
      job: bot?.job ?? "",
      instructions: bot?.instructions ?? "",
      avatar: bot?.avatar ?? nanoid(),
    },
  })

  const avatar = useWatch({ control: form.control, name: "avatar" })

  function onSubmit(values: CreateBotInput) {
    startTransition(async () => {
      const result = bot
        ? await updateBot({ ...values, id: bot.id })
        : await createBot(values)
      if (!result.ok) {
        toast.add({
          title: bot ? "Couldn't save bot" : "Couldn't create bot",
          description: result.error,
        })
        return
      }
      toast.add({ title: bot ? `${values.name} saved` : `${values.name} is ready` })
      onDone()
    })
  }

  function onDelete() {
    if (!bot) return
    startTransition(async () => {
      const result = await deleteBot({ id: bot.id })
      if (!result.ok) {
        toast.add({ title: "Couldn't delete bot", description: result.error })
        return
      }
      toast.add({ title: `${bot.name} deleted` })
      setConfirmOpen(false)
      onDone()
      // The bot's chat no longer exists.
      router.replace("/")
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
      <DialogHeader>
        <DialogTitle>{bot ? "Edit bot" : "New bot"}</DialogTitle>
        <DialogDescription>
          {bot
            ? "Change its face, name, or job."
            : "Give it a face, a name, and a job to do."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        {JOB_SUGGESTIONS.map(({ job, instructions }) => (
          <Button
            key={job}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              const options = { shouldDirty: true, shouldValidate: true }
              form.setValue("job", job, options)
              form.setValue("instructions", instructions, options)
            }}
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
        {bot && (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
            className="sm:mr-auto"
          >
            <Trash2Icon data-icon="inline-start" />
            Delete
          </Button>
        )}
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {bot ? "Save changes" : "Create bot"}
        </Button>
      </DialogFooter>

      {bot && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the bot and its chat. You can&apos;t
                undo this.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                Delete bot
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </form>
  )
}

"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, PencilIcon, ChevronDownIcon } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { updatePayment, type PaymentResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

interface PaymentDetailsDialogProps {
  payment: PaymentResponse
  onSuccess: () => void
}

const formSchema = z.object({
  originalValue: z.string().min(1, "Valor é obrigatório"),
  dueDate: z.date(),
  paymentDate: z.date().optional().nullable(),
  observation: z.string().optional(),
})

export function PaymentDetailsDialog({ payment, onSuccess }: PaymentDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false)
  const [paymentDatePickerOpen, setPaymentDatePickerOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalValue: "",
      observation: "",
    },
  })

  // Load payment data when dialog opens
  useEffect(() => {
    if (open) {
      const formattedValue = payment.originalValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      
      // Parse dates as local time
      const [dyear, dmonth, dday] = payment.dueDate.split('-')
      const dueDate = new Date(parseInt(dyear), parseInt(dmonth) - 1, parseInt(dday))
      
      let paymentDate = null
      if (payment.paymentDate) {
        const [pyear, pmonth, pday] = payment.paymentDate.split('-')
        paymentDate = new Date(parseInt(pyear), parseInt(pmonth) - 1, parseInt(pday))
      }

      form.reset({
        originalValue: formattedValue,
        dueDate,
        paymentDate,
        observation: payment.observation || "",
      })
    }
  }, [open, payment, form])

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPhone = (phone: string | null) => {
    if (!phone) return "---"
    const numbers = phone.replace(/\D/g, "")
    if (numbers.length === 11) {
      // Celular: (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (numbers.length === 10) {
      // Fixo: (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return phone
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PAID: <Badge variant="default" className="bg-green-500">Pago</Badge>,
      PAID_LATE: <Badge variant="default" className="bg-yellow-500">Pago com Atraso</Badge>,
      OVERDUE: <Badge variant="destructive">Atrasado</Badge>,
      PENDING: <Badge variant="secondary">Pendente</Badge>,
    }
    return badges[status as keyof typeof badges] || null
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    try {
      // Parse currency value (1.234,56 -> 1234.56)
      const originalValue = parseFloat(
        values.originalValue.replace(/\./g, "").replace(",", ".")
      )
      
      // Format dates to ISO (YYYY-MM-DD)
      const dueDate = format(values.dueDate, "yyyy-MM-dd")
      const paymentDate = values.paymentDate 
        ? format(values.paymentDate, "yyyy-MM-dd")
        : undefined
      
      await updatePayment(payment.id, {
        originalValue,
        dueDate,
        paymentDate,
        observation: values.observation || undefined,
      })
      
      // Success - close dialog and refresh
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to update payment:", error)
      alert("Erro ao atualizar pagamento. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] lg:max-w-[1200px] w-full p-10 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-6 mb-2">
          <div className="space-y-1">
            <DialogTitle className="text-3xl font-bold tracking-tight">Detalhes do Pagamento</DialogTitle>
            <DialogDescription className="text-base">
              Visualize e gerencie todas as informações deste lançamento
            </DialogDescription>
          </div>
          <div className="flex items-center gap-4 bg-muted/50 px-6 py-3 rounded-xl border shadow-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Status Atual</span>
            {getStatusBadge(payment.paymentStatus)}
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 py-6">
            {/* SEÇÃO 1: Dados de Referência em 4 Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-2">
                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Pagador</FormLabel>
                <p className="text-base font-semibold border-b-2 border-muted pb-2 truncate">{payment.payerName}</p>
              </div>
              
              <div className="space-y-2">
                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Telefone de Contato</FormLabel>
                <p className="text-base font-semibold border-b-2 border-muted pb-2">{formatPhone(payment.payerPhone)}</p>
              </div>

              <div className="space-y-2">
                <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Identificação da Parcela</FormLabel>
                <p className="text-base font-semibold border-b-2 border-muted pb-2">{payment.installmentNumber} / {payment.totalInstallments}</p>
              </div>

              <div className="space-y-2">
                <FormLabel className="text-[11px] font-black text-orange-600 uppercase tracking-[0.15em]">Total com Juros (Hoje)</FormLabel>
                <p className="text-lg font-black text-orange-600 border-b-2 border-orange-100 pb-2">
                  {payment.overdueValue ? payment.overdueValue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  }) : "---"}
                </p>
              </div>
            </div>

            {/* SEÇÃO 2: Campos de Edição em 3 Colunas Largas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <FormField
                control={form.control}
                name="originalValue"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Valor Original</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-muted-foreground font-bold">R$</span>
                        <Input 
                          placeholder="0,00"
                          className="pl-12 h-14 text-lg font-medium shadow-sm" 
                          {...field} 
                          onChange={(e) => field.onChange(formatCurrency(e.target.value))} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Data de Vencimento</FormLabel>
                    <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-between font-medium h-14 text-base shadow-sm", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecionar Data</span>}
                            <ChevronDownIcon className="h-5 w-5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          captionLayout="dropdown"
                          onSelect={(date) => { field.onChange(date); setDueDatePickerOpen(false); }} 
                          fromYear={2020}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-2">
                    <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Data de Recebimento</FormLabel>
                    <Popover open={paymentDatePickerOpen} onOpenChange={setPaymentDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full justify-between font-medium h-14 text-base shadow-sm", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "dd/MM/yyyy") : <span className="text-muted-foreground/60 italic">Aguardando pagamento</span>}
                            <ChevronDownIcon className="h-5 w-5 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value || undefined} 
                          captionLayout="dropdown"
                          onSelect={(date) => { field.onChange(date); setPaymentDatePickerOpen(false); }} 
                          fromYear={2020}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SEÇÃO 3: Observações (Largura Total) */}
            <FormField
              control={form.control}
              name="observation"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em]">Observações do Lançamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Escreva aqui qualquer detalhe importante sobre este pagamento..." {...field} className="h-16 text-base font-medium shadow-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="mt-4 border-t pt-8 flex items-center justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting} className="font-bold text-base px-8">
            Cancelar
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="px-12 h-14 text-lg font-black shadow-lg hover:shadow-xl transition-all">
            {isSubmitting && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

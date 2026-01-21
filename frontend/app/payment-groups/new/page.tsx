"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, ChevronDownIcon } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createPaymentGroup, fetchClients, fetchClientById } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Client {
  id: number
  name: string
  lateFeeRate?: number
  monthlyInterestRate?: number
}

const formSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  payerName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  payerDocument: z.string().min(11, "CPF/CNPJ inválido").max(18, "CPF/CNPJ inválido"),
  monthlyValue: z.string().min(1, "Valor mensal é obrigatório"),
  totalInstallments: z.string().min(1, "Número de parcelas é obrigatório"),
  lateFeeRate: z.string().optional(),
  monthlyInterestRate: z.string().optional(),
  firstInstallmentDueDate: z.date(),
  observation: z.string().optional(),
})

export default function NewPaymentGroupPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      payerName: "",
      payerDocument: "",
      monthlyValue: "",
      totalInstallments: "",
      lateFeeRate: "",
      monthlyInterestRate: "",
      observation: "",
    },
  })

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients()
        setClients(data)
      } catch (error) {
        console.error("Failed to load clients:", error)
      } finally {
        setIsLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercentage = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleClientChange = async (clientId: string) => {
    if (clientId) {
      try {
        const client = await fetchClientById(parseInt(clientId))
        
        if (client.lateFeeRate) {
          const percentage = (client.lateFeeRate * 100).toFixed(2)
          form.setValue("lateFeeRate", percentage.replace(".", ","))
        }
        
        if (client.monthlyInterestRate) {
          const percentage = (client.monthlyInterestRate * 100).toFixed(2)
          form.setValue("monthlyInterestRate", percentage.replace(".", ","))
        }
      } catch (error) {
        console.error("Failed to load client details:", error)
      }
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    try {
      // Parse currency value (1.234,56 -> 1234.56)
      const monthlyValue = parseFloat(
        values.monthlyValue.replace(/\./g, "").replace(",", ".")
      )
      
      // Parse percentage values (2,50 -> 0.025)
      const lateFeeRate = values.lateFeeRate
        ? parseFloat(values.lateFeeRate.replace(",", ".")) / 100
        : undefined
      
      const monthlyInterestRate = values.monthlyInterestRate
        ? parseFloat(values.monthlyInterestRate.replace(",", ".")) / 100
        : undefined
      
      // Format date to ISO (YYYY-MM-DD)
      const firstInstallmentDueDate = format(values.firstInstallmentDueDate, "yyyy-MM-dd")
      
      await createPaymentGroup({
        clientId: parseInt(values.clientId),
        payerName: values.payerName,
        payerDocument: values.payerDocument.replace(/\D/g, ""),
        monthlyValue,
        totalInstallments: parseInt(values.totalInstallments),
        lateFeeRate,
        monthlyInterestRate,
        firstInstallmentDueDate,
        observation: values.observation || undefined,
      })
      
      // Success - redirect to payments page
      router.push("/payments")
    } catch (error) {
      console.error("Failed to create payment group:", error)
      alert("Erro ao criar grupo de pagamentos. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Novo Grupo de Pagamentos</CardTitle>
          <CardDescription>
            Crie um novo grupo de pagamentos para um cliente. As taxas de juros e multa podem ser preenchidas automaticamente ao selecionar um cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        if (value) {
                          handleClientChange(value)
                        }
                      }}
                      value={field.value}
                      disabled={isLoadingClients}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingClients ? "Carregando..." : "Selecione um cliente"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione o cliente responsável pelo grupo de pagamentos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações do Pagador</h3>
                
                <FormField
                  control={form.control}
                  name="payerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pagador</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payerDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatCPFCNPJ(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Detalhes do Pagamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="monthlyValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Mensal</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              placeholder="0,00"
                              className="pl-10"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatCurrency(e.target.value)
                                field.onChange(formatted)
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="12"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Interest Rates */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Taxas de Juros (opcional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lateFeeRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Multa (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPercentage(e.target.value)
                                field.onChange(formatted)
                              }}
                            />
                            <span className="absolute right-3 top-2.5 text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>Ex: 2,00 para 2%</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="monthlyInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Juros Mensal (%)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPercentage(e.target.value)
                                field.onChange(formatted)
                              }}
                            />
                            <span className="absolute right-3 top-2.5 text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormDescription>Ex: 1,00 para 1% ao mês</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* First Due Date */}
              <FormField
                control={form.control}
                name="firstInstallmentDueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Primeiro Vencimento</FormLabel>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            field.onChange(date)
                            setDatePickerOpen(false)
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          fromYear={2020}
                          toYear={2030}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      A data da primeira parcela do grupo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observation */}
              <FormField
                control={form.control}
                name="observation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observações adicionais sobre este grupo de pagamentos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/payments")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Criando..." : "Criar Grupo"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

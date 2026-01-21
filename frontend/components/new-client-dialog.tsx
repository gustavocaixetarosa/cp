"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Plus } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
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
import { createClient } from "@/lib/api"

interface NewClientDialogProps {
  onSuccess: () => void
}

const formSchema = z.object({
  clientName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  document: z.string().min(11, "CPF/CNPJ inválido").max(18, "CPF/CNPJ inválido"),
  phone: z.string().optional(),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
  bank: z.string().optional(),
  lateFeeRate: z.string().optional(),
  monthlyInterestRate: z.string().optional(),
})

export function NewClientDialog({ onSuccess }: NewClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      document: "",
      phone: "",
      address: "",
      bank: "",
      lateFeeRate: "",
      monthlyInterestRate: "",
    },
  })

  const formatDocument = (value: string) => {
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length === 11) {
      // Celular: (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (numbers.length === 10) {
      // Fixo: (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numbers
  }

  const formatPercentage = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    try {
      const lateFeeRate = values.lateFeeRate
        ? parseFloat(values.lateFeeRate.replace(",", ".")) / 100
        : undefined
      
      const monthlyInterestRate = values.monthlyInterestRate
        ? parseFloat(values.monthlyInterestRate.replace(",", ".")) / 100
        : undefined
      
      await createClient({
        clientName: values.clientName,
        document: values.document.replace(/\D/g, ""),
        phone: values.phone ? values.phone.replace(/\D/g, "") : undefined,
        address: values.address,
        bank: values.bank || undefined,
        lateFeeRate,
        monthlyInterestRate,
      })
      
      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to create client:", error)
      alert("Erro ao criar cliente. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Cadastre um novo cliente no sistema
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Dados Básicos</h3>
              
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatDocument(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value)
                            field.onChange(formatted)
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Endereço e Banco */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Endereço e Banco</h3>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do banco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Taxas Padrão */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-foreground">Taxas Padrão</h3>
              
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
                          <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                            %
                          </span>
                        </div>
                      </FormControl>
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
                          <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
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
            {isSubmitting ? "Criando..." : "Criar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

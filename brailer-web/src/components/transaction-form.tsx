"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  CalendarIcon, 
  Upload, 
  X, 
  Image as ImageIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CITIES, BANKS } from "@/lib/mock-data";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

const formSchema = z.object({
  date: z.date().min(new Date("1900-01-01"), "La fecha es requerida."),
  city: z.string().min(1, "Selecciona una ciudad."),
  bank: z.string().min(1, "Selecciona un banco."),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
    message: "El monto debe ser un número válido.",
  }),
  description: z.string().min(2, "La descripción debe tener al menos 2 caracteres."),
  reference: z.string().min(1, "La referencia es requerida."),
  image: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSuccess?: () => void;
  transactionToEdit?: any; // Usar 'any' temporalmente o importar 'Transaction'
}

export function TransactionForm({ onSuccess, transactionToEdit }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    transactionToEdit?.imagen_path ? `${apiService.getBaseUrl().replace('/api', '')}${transactionToEdit.imagen_path}` : null
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: transactionToEdit ? new Date(transactionToEdit.fecha_pago.split('/').reverse().join('-')) : new Date(),
      city: transactionToEdit?.ciudad || "",
      bank: transactionToEdit?.banco_usado || "",
      amount: transactionToEdit?.monto?.toString() || "",
      description: transactionToEdit?.descripcion || "",
      reference: transactionToEdit?.referencia || "",
    },
  });

  // Listener para el evento 'paste' (portapapeles)
  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
              setValue("image", file);
              toast.success("Imagen pegada desde el portapapeles");
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (...event: any[]) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        onChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (onChange: (...event: any[]) => void) => {
    setImagePreview(null);
    onChange(undefined);
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fecha_pago", format(values.date, "dd/MM/yyyy"));
      formData.append("descripcion", values.description);
      formData.append("monto", values.amount);
      formData.append("ciudad", values.city);
      formData.append("banco_usado", values.bank);
      formData.append("referencia", values.reference);
      
      if (values.image) {
        formData.append("image", values.image);
      } else if (transactionToEdit?.imagen_path) {
        formData.append("imagen_path", transactionToEdit.imagen_path);
      }

      if (transactionToEdit) {
        formData.append("id", transactionToEdit.id.toString());
        await apiService.updateTransaction(formData);
        toast.success("Transacción actualizada correctamente");
      } else {
        await apiService.createTransaction(formData);
        toast.success("Transacción guardada correctamente");
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la transacción");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha */}
        <div className="flex flex-col gap-2">
          <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Fecha</Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Popover>
                <PopoverTrigger className="w-full text-left font-normal border-none bg-muted/30 hover:bg-muted/50 transition-colors rounded-md p-2 flex items-center justify-between text-sm cursor-pointer outline-none">
                  {field.value ? (
                    format(field.value, "PPP", { locale: es })
                  ) : (
                    <span className="text-muted-foreground">Selecciona una fecha</span>
                  )}
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-none shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.date && <p className="text-[10px] text-red-500">{errors.date.message}</p>}
        </div>

        {/* Referencia */}
        <div className="flex flex-col gap-2">
          <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Referencia</Label>
          <Controller
            control={control}
            name="reference"
            render={({ field }) => (
              <Input placeholder="Ej: 984215" {...field} className="border-none bg-muted/30 focus-visible:ring-primary/20" />
            )}
          />
          {errors.reference && <p className="text-[10px] text-red-500">{errors.reference.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ciudad */}
        <div className="flex flex-col gap-2">
          <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Ciudad</Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="border-none bg-muted/30 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccionar ciudad" />
                </SelectTrigger>
                <SelectContent className="border-none shadow-xl">
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.city && <p className="text-[10px] text-red-500">{errors.city.message}</p>}
        </div>

        {/* Banco */}
        <div className="flex flex-col gap-2">
          <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Banco</Label>
          <Controller
            control={control}
            name="bank"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="border-none bg-muted/30 focus:ring-primary/20">
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent className="border-none shadow-xl max-h-[300px]">
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.bank && <p className="text-[10px] text-red-500">{errors.bank.message}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div className="flex flex-col gap-2">
        <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Descripción</Label>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input placeholder="Ej: Abono cliente X" {...field} className="border-none bg-muted/30 focus-visible:ring-primary/20" />
          )}
        />
        {errors.description && <p className="text-[10px] text-red-500">{errors.description.message}</p>}
      </div>

      {/* Monto */}
      <div className="flex flex-col gap-2">
        <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Monto (Bs.)</Label>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <Input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              {...field} 
              className="border-none bg-muted/30 focus-visible:ring-primary/20 font-bold text-lg" 
            />
          )}
        />
        <p className="text-[10px] text-muted-foreground">
          Usa valores positivos para ingresos y negativos para egresos.
        </p>
        {errors.amount && <p className="text-[10px] text-red-500">{errors.amount.message}</p>}
      </div>

      {/* Imagen */}
      <div className="flex flex-col gap-2">
        <Label className="text-primary/70 uppercase text-[10px] tracking-widest font-bold">Comprobante de Imagen</Label>
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted hover:border-primary/20 hover:bg-muted/30 transition-all rounded-xl cursor-pointer">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Haga clic para cargar</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, field.onChange)}
                    />
                  </label>
                ) : (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeImage(field.onChange)}
                        className="rounded-full"
                      >
                        <X className="w-4 h-4 mr-2" /> Eliminar
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-primary backdrop-blur-sm">
                        <ImageIcon className="w-3 h-3 mr-1" /> Lista
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? "Guardando..." : "Guardar Registro"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "./transaction-form";

interface TransactionDialogProps {
  onTransactionCreated?: () => void;
  transactionToEdit?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionDialog({ 
  onTransactionCreated, 
  transactionToEdit,
  open: externalOpen,
  onOpenChange: setExternalOpen
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const handleSuccess = () => {
    setOpen(false);
    if (onTransactionCreated) {
      onTransactionCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!transactionToEdit && (
        <DialogTrigger>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Registro
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl shadow-2xl">
        <div className="p-8 pb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-primary">
              {transactionToEdit ? "Editar Transacción" : "Nueva Transacción"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {transactionToEdit 
                ? "Modifica los detalles de la operación seleccionada." 
                : "Completa los detalles de la operación financiera arquitectónica."}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-8 pt-0 overflow-y-auto max-h-[70vh]">
          <TransactionForm onSuccess={handleSuccess} transactionToEdit={transactionToEdit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

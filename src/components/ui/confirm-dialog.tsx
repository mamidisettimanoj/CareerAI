"use client";

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  title?: string;
  description?: string | React.ReactNode;
  triggerText?: React.ReactNode;
  triggerVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function ConfirmDialog({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  triggerText = "Continue",
  triggerVariant = "default",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  destructive = false,
  open,
  onOpenChange,
  showTrigger = true,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) setInternalOpen(newOpen);
    if (onOpenChange) onOpenChange(newOpen);
  };
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          <Button variant={triggerVariant}>{triggerText}</Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={loading}
            className={destructive ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}
          >
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

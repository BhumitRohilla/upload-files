"use client"

import React, { useContext, useEffect } from 'react';
import { Spinner } from '../ui/spinner';
import { AlertContext, AlertType } from '../../app/alert'

export const Loading = () => {
    const { showAlert }  = useContext(AlertContext);
    useEffect(() => {
        showAlert({
            time: 300,
            title: 'TEST',
            type: AlertType.error,
            message: 'TETS',
        })
    }, [showAlert]);
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main>
                <Spinner />
            </main>
        </div>
    )
}
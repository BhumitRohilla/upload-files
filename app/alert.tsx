"use client"
import React, { createContext, useState, useCallback, useEffect } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export enum AlertType {
    success = 1,
    error = 2,
    warning = 3,
}

interface SingleAlert {
    title: string,
    message?: string,
    type: AlertType,
    time: number,
}

interface FinalAlert {
    id: string,
    title: string,
    message?: string,
    type: AlertType,
    showUpto: number,
    show: boolean,
}

interface AlertContext {
    alerts: Array<SingleAlert & { id: string, show: boolean}>
    showAlert: (alert: SingleAlert) => void,
}

interface AlertProviderProps {
    children: React.ReactNode,
}

function fromTypeCreateVariant(text: AlertType) {
    switch(text) {
        case AlertType.success: {
            return 'default'
        }
        case AlertType.error: {
            return 'destructive'
        }
        case AlertType.warning: {
            return 'default'
        }
    }
}

export const AlertContext = createContext<AlertContext>({
    alerts: [],
    showAlert: () => {},
});


export default function AlertContextProvider (props: AlertProviderProps) {
    const { children } = props;
    const [ alerts, setAlert ] = useState<Array<FinalAlert>>([]);

    const showAlert = useCallback((singleAlert: SingleAlert) => {
        const id = crypto.randomUUID();
        setAlert([{
            id: id,
            show: false,
            message: singleAlert.message,
            showUpto: Date.now() + (singleAlert.time * 1000),
            title: singleAlert.title,
            type: singleAlert.type,
        }, ...alerts]);
    }, [setAlert, alerts]);

    const intervalHandler = useCallback((alerts: Array<FinalAlert>) => {
        const currentTime = Date.now();
        const finalResult: Array<FinalAlert> = [];
        alerts.forEach((element) => {
            if (currentTime < element.showUpto) {
                if (element.show == false) {
                    element.show = true;
                }
                return finalResult.push(element)
            }
            if (currentTime > element.showUpto) {
                if (element.show == true) {
                    element.show = false;
                }
            }

            if (( currentTime + (10 * 1000))> element.showUpto) {
                return finalResult.push(element)
            }
        }, []);
        return finalResult;
    }, []);
    useEffect(() => {
        const timeOut = setTimeout(() => {
            const result = intervalHandler(alerts);
            setAlert(result);
        }, 50);
        return () => {
            clearTimeout(timeOut)
        }
    }, [alerts, setAlert]);
    
    return (
        <AlertContext.Provider value={{alerts: [], showAlert}} >
            <div className='fixed top-5 right-5 bg-transparent w-[400px] h-full pointer-events-none'>
                {alerts.map((alert) => {
                    return (
                        <Alert
                            style={{
                                marginBottom: '20px',
                            //     marginLeft: alert.show ? 'auto' : '600px',
                            //     opacity: alert.show ? 1 : 0,
                                transform: alert.show ? 'translateX(0)' : 'translateX(100%)',
                            //     transition: 'all 0.5s ease-in-out',
                            }}
                            key={alert.id}
                            variant={fromTypeCreateVariant(alert.type)}
                            className={`bg-black w-fit ml-auto transition-all delay-150 ${alert.show?'translate-x-0 opacity-100':'-translate-x-[400px] opacity-0'} `}
                        >
                            <AlertTitle>{alert.title}</AlertTitle>
                            {alert.message
                                &&  <AlertDescription>
                                    {alert.message}
                                </AlertDescription>
                            }

                        </Alert>
                    )
                })}
            </div>
            {children}
        </AlertContext.Provider>
    )
}
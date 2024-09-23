'use clint'

import React, { useCallback, useMemo } from 'react';

interface ImagePreviewProps {
    url: string,
}

export const ImagePreview = (props: ImagePreviewProps) => {
    const {url} = props;
    const downloadFile = async (token: string) => {
        const response = await fetch(`/api/download/${token}`);
        const blob = await response.blob();
    
        // Create a temporary link element to trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${token}.mp4`; // Change the filename as needed
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    };
    return (
        <img className='block h-full' src={url ?? ""} />
    )
}
'use clint'

import React from 'react';

interface ImagePreviewProps {
    url: string,
}

export const ImagePreview = (props: ImagePreviewProps) => {
    const {url} = props;
    return (
        <img className='block h-full' src={url ?? ""} />
    )
}
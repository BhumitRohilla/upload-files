'use client';

import React, { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { ImagePreview } from './image'; 
const VideoPreview = dynamic(() => import('./video'), { ssr: false })


interface PreviewProps {
    url: string;
    token: string;
    expireTime: Date;
    contentType: string;   
}

export const Preview = (props: PreviewProps) => {
    const {url, token, contentType} = props;
    const HandlePreview = useCallback((url: string, contentType: string): React.ReactElement => {
        if (contentType.startsWith('image')) {
            return <ImagePreview url={url} />
        }
        if (contentType.startsWith('video')) {
            return <VideoPreview url={url} />
        }
        return (
            <div>Preview Not Available</div>
        )
    }, []);

    const name = useMemo(() => {
        return url.split('/').pop();
    }, [url]);

    
    console.log(url, token, contentType);
    return (
        <div>
            <p className='text-2xl text-center pt-10'>
                Name: {name}
            </p>
            <div className='h-[60vh] flex justify-center align-middle items-center m-auto pt-4'>
                {HandlePreview(url, contentType)}
            </div>
            <div className='m-auto w-fit mt-4'>
                <a href={`/download/${token}`} download className={`bg-red-600 disabled:bg-red-900 border-red-600 border-solid  p-2 px-3 rounded hover:bg-red-700 active:bg-red-900 cursor-pointer`}>Download</a>
            </div>
        </div>
    )
}
'use client'

import Plyr from 'plyr-react';
import React from 'react';
import 'plyr-react/plyr.css'

interface VideoPreviweProp {
    url: string,
}

const VideoPreview = (props: VideoPreviweProp) => {
    const { url } = props;
    return (
        <div style={{ maxWidth: '1024px', height: '100%' }}>
            <Plyr
                src={url}
                source={null}
            />
        </div>
    ) 
}

export default VideoPreview
"use client"

import { ChangeEvent, useCallback, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {Copy} from 'lucide-react'
import Link from 'next/link'
import { AlertContext, AlertType } from './alert'
import { useContext } from "react";
import { Loader2 } from "lucide-react"
import axios from "axios";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [shortURL, setShortUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useContext(AlertContext);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, []);
  const removeFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFileName('')
    setFileType('');
  }, [setFileName, setFileType]);

  const handleMultiPartUpload = useCallback(async (response: { uploadUrls: Array<string> }) => {
    const file = fileInputRef?.current?.files?.[0];
    if (!file) {
      return false;
    }
  
    const parts: Array<{ ETag: string, PartNumber: number }> = [];
    const chunkSize = Math.ceil(file.size / response.uploadUrls.length);
    let offset = 0;
    let totalFileUpload = 0;
  
    for (let index = 0; index < response.uploadUrls.length; ++index) {
      try {
        const url = response.uploadUrls[index];
        const endOffset = Math.min(offset + chunkSize, file.size); // Ensure endOffset does not exceed file size
        const blob = file.slice(offset, endOffset);
        const formData = new FormData();
        formData.append('file', blob);
  
        const uploadResponse = await axios.put(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        totalFileUpload += chunkSize;
        setUploadProgress(Math.round((totalFileUpload / file.size) * 100));
        parts.push({ ETag: uploadResponse.headers['etag'], PartNumber: index + 1 });
        offset = endOffset;
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ) {
          throw new Error(error?.message);
        }
        throw new Error('Something went wrong');
      }
    }
  
    return parts;
  }, [setUploadProgress]);  

  const handleSimpleUpload = useCallback(async (response: {url: string, fields: {[key: string]: string}}) => {
    if (!formRef.current) {
      return false;
    }
    const formData = new FormData(formRef.current);
    const url = response.url;
    const fields = response.fields;
    const formDataToSend = new FormData();
    Object.keys(fields).forEach((key) => {
      formDataToSend.set(key, fields[key]);
    });
    formData.forEach((value, key) => {
      formDataToSend.set(key, value);
    })
    return axios.post(url, formDataToSend, {
      'headers': {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / (event.total ?? 1)) * 100);
          setUploadProgress(progress);
        }
      }
    });
  }, [setUploadProgress]);

  const handleFileUpload = useCallback(async () => {
    try {
      setShortUrl('');
      if(loading) {
        return;
      }
      setLoading(true);
      if (!formRef.current) {
        return false;
      }
      if (!fileInputRef.current) {
        return false;
      }
      const file = fileInputRef.current.files?.[0];
      if (!file) {
        return false;
      }
      let useMultiPartUpload = false;
      if ((file.size / 1024 / 1024) > 10 ) {
        useMultiPartUpload = true;
      }
      const response = await axios.post('/api/upload', {
        contentType: fileType,
        fileName: fileName,
        fileSize: file.size,
        multiPartUpload: useMultiPartUpload,
      })
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      const {token, uploadUrl, uploadUrls} = response.data;
      if (uploadUrls) { 
        const parts = await handleMultiPartUpload({uploadUrls});
        await axios.put('/api/complete-multipart-upload', {
          token: token,
          parts: parts,
        });
      }
      if (uploadUrl) {
        await handleSimpleUpload(uploadUrl);
      }
      setShortUrl(`${window.location.protocol}//${window.location.host}/${token}`)
      showAlert({
        message: 'File uploaded successfully.',
        time: 10,
        title: 'Success',
        type: AlertType.success,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFileName('');
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        showAlert({
          message: error?.message ?? error ?? '',
          time: 2,
          title: 'Something went wrong',
          type: AlertType.error,
        });
      }
      console.error(error);
    } finally{
      setLoading(false);
      setUploadProgress(0)
    }
  }, [fileType, fileName, showAlert, setFileName, setUploadProgress]);

  const handleFileChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    console.log(ev)
    if (ev.target.files?.length) {
      setFileName(ev.target.files[0].name);
      setFileType(ev.target.files[0].type);
    }
  }, [setFileName, setFileType]);

  const handleCopy = useCallback((stringToCopy: string) => {
    console.log(stringToCopy);
    window.navigator.clipboard.writeText(stringToCopy);
    showAlert({
      time: 10,
      title: 'Link Copied.',
      type: AlertType.success,
    });
  }, [showAlert]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div></div>
      <main className="min-h-[200px]">
        <h1 className="text-[32px] text-center font-medium">
          Upload Files
        </h1>
        <div>
          <div className="flex justify-center gap-2 pt-7 pb-7">
            <button onClick={fileName?handleFileUpload:addFile} disabled={loading} className={`bg-red-600 disabled:bg-red-900 border-red-600 border-solid  p-1 px-3 rounded hover:bg-red-700 active:bg-red-900`}>{loading?<p className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading</p>:fileName?'Upload':'Select'}</button>
            <button onClick={removeFile} className="p1 px-3 rounded bo border-solid border-gray-300 hover:bg-gray-300 hover:text-black delay-100 transition-colors ease-in-out border-[2px]">Cancel</button>
          </div>
          <form ref={formRef}>
              {fileName &&
                <>
                  <div className="text-center">Selected File: {fileName}</div>
                </>
              }
              <div></div>
              <input name="file" onChange={handleFileChange} ref={fileInputRef} className="hidden" type="file"></input>
          </form>
          {loading &&
            <div className="w-60 m-auto pt-5">
              <Progress value={uploadProgress} className="bg-gray-800"  />
            </div>
          }
        </div>
      </main>
      <footer>
        {shortURL &&
          <Alert variant="default" className={`transition-all delay-300 ease-in-out`}>
            <AlertTitle>Use This Link: </AlertTitle>
            <AlertDescription>
              <div className="flex flex-row gap-3">
                <Link className="w-full h-full pt-1 pb-1 after:bottom-0 after:absolute after:transition-all after:ease-in-out after:delay-150 hover:after:w-full transition-all delay-500 ease-in-out" href={`${shortURL}`}>
                  <span className="break-all">{shortURL}</span>
                </Link>
                <button onClick={() => handleCopy(shortURL)} className="hover:bg-gray-800 p-1 transition-all delay-100 ease-in-out rounded-sm active:bg-gray-900"><Copy size={20} /></button>
              </div>
            </AlertDescription>
          </Alert>
        }
      </footer>
    </div>
  );
}

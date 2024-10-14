"use client"

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {Copy} from 'lucide-react'
import Link from 'next/link'
import { AlertContext, AlertType } from './alert'
import { useContext } from "react";
import { Loader2 } from "lucide-react"
import axios, { AxiosError, CancelTokenSource } from "axios";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [shortURL, setShortUrl] = useState<string>('');
  const [reqCancelFunction, setReqCancelFunction] = useState< CancelTokenSource  | null >(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { showAlert } = useContext(AlertContext);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, []);

  const handleCancelRequest = useCallback(() => {
    if (reqCancelFunction) {
      reqCancelFunction.cancel();
      setReqCancelFunction(null);
    }
  }, [reqCancelFunction, setReqCancelFunction]);

  const removeFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    handleCancelRequest();
    setFileName('')
    setFileType('');
    multipartUploadHandlerRef.current = null;
  }, [setFileName, setFileType, handleCancelRequest]);

  const multipartUploadHandlerRef = useRef<{ uploadUrls: Array<string>, currentIndex: number, parts: Array<{ETag: string, PartNumber: number}>, token: string } | null>(null)

  const handleMultiPartUploadWithRetry = useCallback( async () => {
    let isCanceled = false;
    try {
      setShowRetryButton(false);
      setLoading(true);
      const file = fileInputRef?.current?.files?.[0];
      if (!file) {
        return false;
      }
      if (!multipartUploadHandlerRef.current) {
        return;
      }
      const source = axios.CancelToken.source();
      const chunkSize = Math.ceil(file.size / multipartUploadHandlerRef.current.uploadUrls.length);
      let offset = 0;
      let numberOfContinuousFailure = 0;
      let totalFileUpload = chunkSize * multipartUploadHandlerRef.current.currentIndex;
      while ( multipartUploadHandlerRef.current.currentIndex < multipartUploadHandlerRef.current.uploadUrls.length) {
        try {
          if (numberOfContinuousFailure > 3) {
            break;
          }
          const index = multipartUploadHandlerRef.current.currentIndex;
          console.log(`Uploading at index: ${index}`);
          const url = multipartUploadHandlerRef.current.uploadUrls[index];
          const endOffset = Math.min(offset + chunkSize, file.size);
          const blob = file.slice(offset, endOffset);
          const formData = new FormData();
          formData.append('file', blob);
          const uploadResponse = await axios.put(url, formData, {
            cancelToken: source.token,
            timeout: 2 * 60 * 1000,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          totalFileUpload += chunkSize;
          setUploadProgress(Math.round((totalFileUpload / file.size) * 100));
          multipartUploadHandlerRef.current.parts.push({
            ETag:  uploadResponse.headers['etag'],
            PartNumber: index + 1,
          })
          offset = endOffset;
          numberOfContinuousFailure = 0;
          multipartUploadHandlerRef.current.currentIndex++;
        } catch (error) {
          console.log('Some Error Occured');
          numberOfContinuousFailure++;
          console.log(error);
          if (axios.isCancel(error)) {
            isCanceled = true;
            break;
          }
          console.log(error);
        }
      }
      console.log('Outside function');
      if (numberOfContinuousFailure > 3) {
        throw new Error('Unable to continue upload, please check your network connection then retry to continue from where you left.');
      }
      await axios.put('/api/complete-multipart-upload', {
        token: multipartUploadHandlerRef.current.token,
        parts: multipartUploadHandlerRef.current.parts,
      });
      setShowRetryButton(false);
      setLoading(false);
      setShortUrl(`${window.location.protocol}//${window.location.host}/${multipartUploadHandlerRef.current.token}`)
      showAlert({
        message: 'File uploaded successfully.',
        time: 4,
        title: 'Success',
        type: AlertType.success,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFileName('');
    } catch (error) {
      console.log('Completely outside');
      console.log(error);
      if (!multipartUploadHandlerRef.current || isCanceled) {
        multipartUploadHandlerRef.current = null;
        setLoading(false);
        return;
      }
      setShowRetryButton(true);
      setLoading(false);
      if (error instanceof AxiosError && axios.isCancel(error)) {
        return;
      }
      if (error instanceof AxiosError) {
        return showAlert({
          message: error.response?.data?.message ?? error.response?.data?.error ?? error.message,
          time: 4,
          title: 'Something went wrong',
          type: AlertType.error,
        })
      }
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        showAlert({
          message: error?.message ?? error ?? '',
          time: 4,
          title: 'Something went wrong',
          type: AlertType.error,
        });
      }
    }
  }, [setUploadProgress]);

  const handleMultiPartUpload = useCallback(async (response: { uploadUrls: Array<string> }, token: string) => {
    const file = fileInputRef?.current?.files?.[0];
    if (!file) {
      return false;
    }
    multipartUploadHandlerRef.current = {
      uploadUrls: response.uploadUrls,
      currentIndex: 0,
      parts: [],
      token: token,
    }
    handleMultiPartUploadWithRetry();
  }, [handleMultiPartUploadWithRetry]); 

  const handleSimpleUpload = useCallback(async (response: {url: string, fields: {[key: string]: string}}, token: string) => {
    const source = axios.CancelToken.source();
    setReqCancelFunction(source)
    try {
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
      await axios.post(url, formDataToSend, {
        cancelToken: source.token,
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
      setShortUrl(`${window.location.protocol}//${window.location.host}/${token}`)
      showAlert({
        message: 'File uploaded successfully.',
        time: 4,
        title: 'Success',
        type: AlertType.success,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFileName('');
    } catch (error) {
      if (error instanceof AxiosError && axios.isCancel(error)) {
        return;
      }
      if (error instanceof AxiosError) {
        return showAlert({
          message: error.response?.data?.message ?? error.response?.data?.error ?? error.message,
          time: 4,
          title: 'Something went wrong',
          type: AlertType.error,
        })
      }
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        showAlert({
          message: error?.message ?? error ?? '',
          time: 4,
          title: 'Something went wrong',
          type: AlertType.error,
        });
      }
    }
  }, [setUploadProgress, setReqCancelFunction]);

  const handleFileUpload = useCallback(async () => {
    try {
      setUploadProgress(0);
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
        await handleMultiPartUpload({uploadUrls}, token);
      }
      if (uploadUrl) {
        await handleSimpleUpload(uploadUrl, token);
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        return showAlert({
          message: error.response?.data?.message ?? error.response?.data?.error ?? error.message,
          time: 2,
          title: 'Something went wrong',
          type: AlertType.error,
        })
      }
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        showAlert({
          message: error?.message ?? error ?? '',
          time: 4,
          title: 'Something went wrong',
          type: AlertType.error,
        });
      }
      console.error(error);
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
      time: 4,
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
            <UploadButton
              fileName={fileName}
              loading={loading}
              retry={showRetryButton}
              add={addFile}
              handleRetry={handleMultiPartUploadWithRetry}
              handleUpload={handleFileUpload}
            />
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

interface UploadButtonProps {
  retry: boolean,
  loading: boolean,
  fileName: string,
  add: () => void,
  handleUpload: () => void,
  handleRetry: () => void,
}

function UploadButton(props: UploadButtonProps) {
  const { retry, loading, fileName, add, handleUpload, handleRetry } = props;
  const {buttonText, onClickFunction} = useMemo(() => {
    if (retry) {
      return {buttonText: <p>Retry</p>, onClickFunction: handleRetry}
    };
    if (loading) {
      return {buttonText: <p className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading</p>, onClickFunction: () => {}}
    }
    if (fileName) {
      return {buttonText: <p>Upload</p>, onClickFunction: handleUpload}
    }
    return {buttonText: <p>Select</p>, onClickFunction: add}
  }, [retry, loading,fileName]);
  return <button onClick={onClickFunction} disabled={loading} className={`bg-red-600 disabled:bg-red-900 border-red-600 border-solid  p-1 px-3 rounded hover:bg-red-700 active:bg-red-900`}>{buttonText}</button>
}
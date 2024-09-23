
import { Preview } from "@/components/file-preview";
import controller from "@/controller";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface Props {
  params: { id: string };
}

export default async function Page({ params }: Props) {
    const uploadFileObj = await controller.UserController.findUrlByToken(params.id);
    if (!uploadFileObj) {
        notFound();
    }
    return (
        <div>
            <Suspense>
                <Preview {...uploadFileObj}/>
            </Suspense>
        </div>
    )
}

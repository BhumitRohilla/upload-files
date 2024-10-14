"use client"

import { Spinner } from "@/components/ui/spinner";
import { useEffect, useRef } from "react";

export default function Loading() {
	const titleRef = useRef<HTMLParagraphElement>(null);
	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		interval = setInterval(() => {
			if (titleRef.current) {
				const title = titleRef.current.innerText;
				const numberOfDots = title.replace("Loading", "").length;
				let newNumber = numberOfDots
				if (numberOfDots > 3) {
					newNumber = 0;
				} else {
					newNumber += 1;
				}
				let newTitle = "Loading";
				for (let index = 0; index < newNumber; ++index) {
					newTitle += "."
				}
				console.log(newTitle, newNumber);
				titleRef.current.innerText = newTitle;
			}
		}, 1000);
		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, []);
    return (
		<div id="loading" className="w-full h-full">
			<div className="w-full h-full flex items-center justify-center flex-col">
				<Spinner show={true} size="large" className="text-[#ededed]"/>
				<p ref={titleRef} className="mt-2">
					Loading.
				</p>
			</div>
		</div>
    )
  }
  
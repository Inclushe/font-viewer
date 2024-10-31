import React from "react";
import { FontControlContext } from "../FontControlProvider";

function Font({ font }) {
	const { sampleText } = React.useContext(FontControlContext);
	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	React.useEffect(() => {
		if (canvasRef.current === null) return;
		const canvas = canvasRef.current;
		const ctx: CanvasRenderingContext2D | null =
			canvasRef.current.getContext("2d");
		if (ctx === null) return;
		// Set canvas size to correspond to device pixel ratio
		const width = canvas.dataset.width;
		const height = canvas.dataset.height;
		canvas.width = window.devicePixelRatio * width;
		canvas.height = window.devicePixelRatio * height;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		// font.opentype.draw(
		// 	ctx,
		// 	sampleText,
		// 	0,
		// 	32 * window.devicePixelRatio,
		// 	32 * window.devicePixelRatio,
		// 	{
		// 		fill: "green",
		// 	},
		// );
		let textContent = sampleText;
		if (sampleText === "") {
			textContent = font.opentype?.names?.fontFamily?.en;
		}
		const path = font.opentype.getPath(
			textContent,
			0,
			32 * window.devicePixelRatio,
			32 * window.devicePixelRatio,
		);
		path.fill = "white";
		path.draw(ctx);
		// console.log(font.opentype);
	}, [canvasRef, sampleText]);
	return (
		<div className="bg-gray-900 rounded-lg border border-gray-800 p-4 pt-2 overflow-hidden">
			<canvas data-width="1000" data-height="40" ref={canvasRef}></canvas>
			<p key={font.name} className="text-xs text-gray-400 mt-1">
				{font.opentype?.names?.fontFamily?.en} -{" "}
				{font.opentype?.names?.fontSubfamily?.en}
			</p>
		</div>
	);
}

export default Font;

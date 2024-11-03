import React from "react";
import { FontControlContext } from "../FontControlProvider";
import { FontStoreContext } from "../FontStoreProvider";
import { useInView } from "react-intersection-observer";

function Font({ id }) {
	const { sampleText } = React.useContext(FontControlContext);
	const { opentypeDefinitions, createOpentypeDefinition } =
		React.useContext(FontStoreContext);
	const { ref, inView, entry } = useInView({
		/* Optional options */
		threshold: 0,
		rootMargin: "200px",
	});
	const [opentypeDefinition, setOpentypeDefinition] = React.useState(null);

	const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
	React.useEffect(() => {
		async function init() {
			if (!inView) return;
			let currentOpentypeDefinition = null;
			if (opentypeDefinitions[id]) {
				currentOpentypeDefinition = opentypeDefinitions[id];
			} else {
				currentOpentypeDefinition = await createOpentypeDefinition(id);
			}
			setOpentypeDefinition(currentOpentypeDefinition);
			// console.log(currentOpentypeDefinition);

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
			if (currentOpentypeDefinition === null) return;

			let textContent = sampleText;
			if (sampleText === "") {
				textContent = currentOpentypeDefinition?.names?.fontFamily?.en;
			}
			const path = currentOpentypeDefinition.getPath(
				textContent,
				0,
				32 * window.devicePixelRatio,
				32 * window.devicePixelRatio,
			);
			path.fill = "white";
			path.draw(ctx);
		}
		init();
	}, [canvasRef, sampleText, inView]);
	return (
		<div
			ref={ref}
			className="bg-gray-900 rounded-lg border border-gray-800 p-4 pt-2 overflow-hidden"
		>
			<canvas
				data-width="1000"
				data-height="40"
				ref={canvasRef}
				style={{ width: 1000, height: 40 }}
			></canvas>
			<p className="text-xs text-gray-400 mt-1">
				{opentypeDefinition?.names?.fontFamily?.en} -{" "}
				{opentypeDefinition?.names?.fontSubfamily?.en}
			</p>
		</div>
	);
}

export default Font;

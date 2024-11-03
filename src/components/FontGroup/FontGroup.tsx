import React from "react";
import Font from "../Font";

function FontGroup({ fontName, ids }) {
	return (
		<>
			<details open>
				<summary className="text-lg font-bold">{fontName}</summary>
				<div className="flex flex-col gap-1 py-1">
					{ids.map((id) => (
						<Font key={id} id={id} />
					))}
				</div>
			</details>
		</>
	);
}

export default FontGroup;

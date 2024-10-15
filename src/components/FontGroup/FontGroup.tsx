import React from "react";
import Font from "../Font";

function FontGroup({ fontName, fontFiles }) {
	return (
		<>
			<details open>
				<summary className="text-lg font-bold">{fontName}</summary>
				<div className="flex flex-col gap-1 py-1">
					{fontFiles.map((fontFile) => (
						<Font key={fontFile.name} font={fontFile} />
					))}
				</div>
			</details>
		</>
	);
}

export default FontGroup;

import * as React from "react";
import { FontControlContext } from "../FontControlProvider";

function TextInput() {
	const { sampleText, setSampleText } = React.useContext(FontControlContext);
	return (
		<div className="w-full overflow-hidden flex">
			<input
				type="text"
				value={sampleText}
				className="p-2 my-4 rounded-lg bg-gray-700 border border-gray-600 w-full overflow-hidden text-white"
				placeholder="Enter preview text"
				onChange={(event) => {
					setSampleText(event.target.value);
				}}
			/>
		</div>
	);
}

export default TextInput;

import * as React from "react";
import { FontControlContext } from "../FontControlProvider";

function TextInput() {
	const { sampleText, setSampleText } = React.useContext(FontControlContext);
	return (
		<div className="w-full overflow-hidden flex">
			<input
				type="text"
				value={sampleText}
				className="p-2 my-4 rounded-lg bg-gray-100 border border-gray-200 w-full overflow-hidden"
				onChange={(event) => {
					setSampleText(event.target.value);
				}}
			/>
		</div>
	);
}

export default TextInput;

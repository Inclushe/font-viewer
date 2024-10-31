import * as React from "react";
import { useDropzone } from "react-dropzone";

function DropZone({ callback, children, ...delegated }) {
	const onDrop = React.useCallback(callback, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		useFsAccessApi: false,
	});
	const divProps = { ...delegated, ...getRootProps() };

	return (
		<div {...divProps}>
			<input {...getInputProps({ webkitdirectory: "true" })} />
			{children}
		</div>
	);
}

export default DropZone;

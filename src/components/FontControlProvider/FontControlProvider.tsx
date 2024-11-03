import * as React from "react";

export const FontControlContext = React.createContext(null);

function FontControlProvider({ children }) {
	const [sampleText, setSampleText] = React.useState("");

	const value = React.useMemo(() => {
		return { sampleText, setSampleText };
	}, [sampleText]);

	return (
		<FontControlContext.Provider value={value}>
			{children}
		</FontControlContext.Provider>
	);
}

export default FontControlProvider;

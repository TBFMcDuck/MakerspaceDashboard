class Progress {
	constructor({parent, cornerRadius="20px", width="100%", height="100%", barColor="green", backgroundColor="black", minPercent=0} = {}) {
		let container = document.createElement("div");
		container.style.position = "relative";
		container.style.backgroundColor = backgroundColor; 
		container.style.borderRadius = cornerRadius;
		container.style.border = "none";
		container.style.width = width;
		container.style.height = height;
		container.style.overflow = "hidden";
		this.container = container;

		if(parent instanceof String) {
			document.getElementById(parent).appendChild(container);	
		} else if(parent instanceof Element) {
			parent.appendChild(container);
		}

		let bar = document.createElement("div");
		bar.style.position = "relative";
		bar.style.backgroundColor = barColor;
		bar.style.borderRadius = cornerRadius;
		bar.style.height = "100%";
		bar.style.width = "100%";
		bar.style.left = "-100%";
		this.container.appendChild(bar);
		this.bar = bar;
		this.minPercent = minPercent;
	}

	addMidElement(el, isText=true) {
		this.container.appendChild(el);
		el.style.position = "absolute";
		el.style.top = "50%";
		el.style.left = "50%";
		if(isText) {
			el.style.width = "100%";
			el.style.textAlign = "center";

		}
		el.style.padding = "0";
		el.style.margin = "0";
		el.style.transform = "translate(-50%, -50%)";
		el.style.zIndex = 1;
	}

	// Percent from 0 - 1
	setProgress(percent) {
		percent = Math.max(this.minPercent, Math.min(Math.max(percent, 0), 1));
		this.bar.style.left = "-" + ((1-percent)*100) + "%";
	}
};
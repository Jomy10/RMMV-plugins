package api

import (
	"io/ioutil"
	"net/http"
)

// TODO: inlcude license + README + required plugins
func DownloadInputManager(res http.ResponseWriter, req *http.Request) {
	fileBytes, err := ioutil.ReadFile("../JOMY_inputManager.js")
	if err != nil {
		http.Error(res, "Couldn't read files on the server", http.StatusInternalServerError)
		return
	}

	res.WriteHeader(http.StatusOK)
	res.Header().Set("Content-Type", "application/octet-stream")
	res.Write(fileBytes)
}

﻿Type.registerNamespace("PowerTools");

// Constructs a new worker. Reads item TcmUri from URL.
PowerTools.AppDataInspectorWorker = function()
{
    this.properties = [];
    var p = this.properties;
    p.processId = null;
    p.itemId = $url.getHashParam("id");
    p.pollInterval = 500; //Milliseconds between each call to check the status of a process
};

// Initiate the call to the service to retrieve all Application Data for the given item
PowerTools.AppDataInspectorWorker.prototype.execute = function()
{
    var p = this.properties;
	if (!p.itemId) return;

    // prepare UI
    $j('#tbody').html("<tr class=\"row0\"><td colspan=\"3\">Loading...</td></tr>");
    $j('#ProgressBar').css({ 'width': '1%', 'display': 'block' });
    $j('#ProgressStatus').html("Loading...");
    $j('#CloseDialog').hide();

    var dialog = $j("#dialog");
    var win = $j(window);
    //Get the window height and width
    var winH = win.height();
    var winW = win.width();

    //Set the popup window to center
    dialog.css({
        "top": (winH - dialog.height()) / 2,
        "left": (winW - dialog.width()) / 2
    }).fadeIn(400);

    // initiate service call
    var onSuccess = Function.getDelegate(this, this._onExecuteStarted);
    var onFailure = null;
    var context = null;

    PowerTools.Model.Services.AppDataInspector.Execute(p.itemId, onSuccess, onFailure, context, false);
};

// Once the call for app data has been initialised, this call back will start polling for progress status updates
PowerTools.AppDataInspectorWorker.prototype._onExecuteStarted = function (result)
{
    if (result && result.Id)
    {
        this._pollStatus(result.Id);
    }
};

// Initiate the call for actual data. This call back is called once the service Execute method completed 
// and data is ready on the service to be picked up.
PowerTools.AppDataInspectorWorker.prototype._getData = function (id)
{
    if (id)
    {
        var onSuccess = Function.getDelegate(this, this._handleDataResponse);
        var onFailure = null;
        var context = null;
        PowerTools.Model.Services.AppDataInspector.GetData(onSuccess, onFailure, context, false);
    }
};

// Call back handling the actual response with Application Data data. Update the UI.
PowerTools.AppDataInspectorWorker.prototype._handleDataResponse = function (response)
{
    var p = this.properties;
    var content = "";
    var i = 0;

	function getDataCell(data, dataType)
	{
		if (dataType.indexOf("image/") == 0)
		{
			if (btoa)
			{
				try
				{
					return "<td><img src='data:" + dataType + ";base64," + btoa(data) + "'/></td>";
				} 
				catch(e) { }
			}
			return "<td>(Unable to display image)</td>";
		}

		if (dataType.indexOf("XmlDocument") > -1 || dataType.indexOf("XmlElement") > -1)
		{
			return "<td><div class='pre'>" + $ptUtils.htmlEncode(data) + "</div></td>";
		}

		if (dataType.indexOf("DateTime") > -1)
		{
			var parsedDate = Date.parse(data);
			return "<td title='" + data + "'>" + parsedDate.toLocaleString() + "</td>";
		}

		return "<td>" + $ptUtils.wbr($ptUtils.htmlEncode(data), 12) + "</td>";
	}

	response.each(function (elem)
    {
        content += "<tr class=\"row" + (i % 2) + "\"><td>" + $ptUtils.wbr($ptUtils.htmlEncode(elem.ApplicationId), 12) +
                "</td>" + 
				getDataCell(elem.Value, elem.Type) +
                "<td>" + 
				$ptUtils.wbr($ptUtils.htmlEncode(elem.Type), 12) +
                "</td</tr>";
        i++;
    });

    if (!content)
    {
        content = "<tr class=\"row0\"><td colspan=\"3\" align=\"center\">No data found</td></tr>";
    }

    $j('#tbody').html(content);

    // hide progress bar
    $j('#mask, .window').hide();
    $j('#ProgressStatus').html("");
    $j('#ProgressBar').css({ 'width': 0 + '%', 'display': 'none' });
};

// Initiate progress status update requests to the service. Schedules itself to run again after pollInterval is reached.
PowerTools.AppDataInspectorWorker.prototype._pollStatus = function (id)
{
    var onSuccess = Function.getDelegate(this, this._handleStatusResponse);
    var onFailure = null;
    var context = null;

    var callback = function ()
    {
        PowerTools.Model.Services.AppDataInspector.GetProcessStatus(id, onSuccess, onFailure, context, false);
    };

    setTimeout(callback, this.properties.pollInterval);
}

// Call back that handles progress status reponses. If process completed, call _getData to retrieve the data. Update UI.
PowerTools.AppDataInspectorWorker.prototype._handleStatusResponse = function (result)
{
    var p = this.properties;
    p.processId = result.Id;
    $j('#ProgressStatus').html(result.Status);
    $j('#ProgressBar').css({ 'width': result.PercentComplete + '%', 'display': 'block' });

    if (result.PercentComplete < 100)
    {
        this._pollStatus(p.processId);
    }
    else
    {
        this._getData(p.processId);
        $j('#ProgressStatus').html(result.Status);
        p.processId = "";
    }
}

// Register this class with the Namespace
PowerTools.AppDataInspectorWorker.registerClass("PowerTools.AppDataInspectorWorker");

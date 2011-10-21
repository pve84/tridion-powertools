﻿Type.registerNamespace("PowerTools.Commands");

PowerTools.Commands.Example = function ()
{
    Type.enableInterface(this, "PowerTools.Commands.Example");
    this.addInterface("Tridion.Cme.Command", ["Example"]);
    this.addInterface("PowerTools.ToolBase", ["ExampleTool"]);
};

PowerTools.Commands.Example.prototype.isAvailable = function (selection)
{
    return true;
};

PowerTools.Commands.Example.prototype.isEnabled = function (selection)
{
    return true;
};

PowerTools.Commands.Example.prototype._execute = function (selection)
{
    var uriSelection = selection.getItem(0);
    var PopUpUrl = $ptUtils.expandPath("/PowerTools/Client/Example/Example.aspx") + "?id=" + uriSelection;
    var popup = $popup.create(PopUpUrl, "toolbar=no,width=600,height=400,resizable=false,scrollbars=false", null);
    popup.open();
};


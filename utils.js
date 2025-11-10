module.exports.is_devcommand = (command, dev_list) => {
    return dev_list.includes(command) ? true : false
}
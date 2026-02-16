# MVP

## Initial Screen
- User will see a onboarding screen
- User will be asked to add a url for DevOps Service
- User will be asked to name the connection
- User will be asked if this is a host or a orchestrator
- User will be asked for a Username
- User will be asked for a Password
- User will need to test the connection
    - A test button will be active if all fields are filled in
    - A Save button will be active if the test is successful
- User will be asked to save the connection
- User will then be moved to the homescreen


## Homescreen

- User will see a section where it shows all of the hosts/orchestrators that are defined 
    - User will have the ability to add a new host/orchestrator
    - User will have the ability to set the default host/orchestrator
    - We will define a icon for each host/orchestrator based on the name
    - We will be able to visually see if the connection is active or not and if the host/orchestrator is healthy
- User will see a section where we show a collapsed panel like section for the selected orchestrator
    - User will have the ability to expand the panel to see the details of each section
    - The sections will be:
        - Information
        - Management
            - We have Users
            - We have Roles
            - We have Claims
            - Cache
        - Resources
            - We have a dashboard for each resource with colors for thresholds: green, amber, red
            - We list all the data for the resources that composed the charts
        - Hosts (Only for Orchestrator)
            - We have a list of all the hosts
            - We will allow drilldown to the host
                - We will show the same information as the orchestrator but for the host
        - Virtual Machines
            - We list all the virtual machines on that host/orchestrator as a table
            - We will show a header with panels for each of the states of the virtual machines
                - like 5 started, 4 stopped, 1 paused
            - We will have a button on the row for showing the details of the virtual machine
                - This will pop up a modal with the details of the virtual machine
        - Logs
            - We will show in the panel a live view of the logs with the ability to filter by level or search work
            - We will limit to a 500 lines of logs then we will implement a fifo
            - We will allow the user to clear the logs
            - We will allow the user to download the logs

## Settings

- User will see a button in the header for settings
    - User will be able to edit the connection
    - User will be able to delete the connection
    - User will be able to test the connection
    - User will be able to save the connection

## Status Bar

- User will be able to see in the status bar
    - User will see the condition of the current websocket connection to the host/orchestrator
    - User will see the version of the devops service underlying


## Planning

- Sai will create a service for the devops service
    - Service will have a login endpoint to get a JWT token (initially we will use static username and password)
    - Service will have a endpoint to get the information of the host/orchestrator (Look at VSCode Extension for reference)
    - Service will have a endpoint to get the users and apply CRUD operations
    - Service will have a endpoint to get the roles and apply CRUD operations
    - Service will have a endpoint to get the claims and apply CRUD operations
    - Service will have a endpoint to manage cache
        - Service will have a endpoint to clear the cache
        - Service will have a endpoint to clear individual cache items
        - Service will have a endpoint to delete a cache item
    - Service will have a endpoint to list resources (Look at VSCode Extension for reference)
        - Service will have a endpoint to get filtered resources for the dashboard

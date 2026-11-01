import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead, type WorkOrderNotification } from "./notificationApi";
import { Alert, Badge, Box, Button, CircularProgress, Divider, IconButton, List, ListItemButton, ListItemText, Popover, Stack, Typography } from "@mui/material";
import { DoneAllRounded, NotificationsNoneRounded } from "@mui/icons-material";

const refreshIntervalMilliseconds = 60_000;

function formatNotificationDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
}

function getNotificationAriaLabel(unreadCount: number) {
    if (unreadCount === 0) {
        return 'Notifications';
    }

    return `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`;
}

export function NotificationMenu() {
    const navigate = useNavigate();

    const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
    const [notifications, setNotifications] = useState<WorkOrderNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const [errorMessage, setErrormessage] = useState<string | null>(null);

    const isMounted = useRef(true);

    const isOpen = Boolean(anchorElement);

    const loadUnreadCount = useCallback(async () => {
        try {
            const response = await getUnreadNotificationCount();

            if (isMounted.current) {
                setUnreadCount(response.count);
            }
        } catch {
            // A temporary notification failure should not interrupt the application shell.
        }
    }, []);

    const loadNotifications = useCallback(async () => {
        setIsLoading(true);
        setErrormessage(null);

        try {
            const response = await getNotifications();

            if (isMounted.current) {
                setNotifications(response);
                setUnreadCount(response.filter(n => !n.isRead).length);
            }
        } catch {
            if (isMounted.current) {
                setErrormessage('Unable to load notifications. Please try again in a moment.');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;

        void loadUnreadCount();

        const intervalId = window.setInterval(() => {
            void loadUnreadCount();
        }, refreshIntervalMilliseconds);

        return () => {
            isMounted.current = false;
            window.clearInterval(intervalId);
        };
    }, [loadUnreadCount]);

    async function handleOpen(event: MouseEvent<HTMLElement>) {
        setAnchorElement(event.currentTarget);
        await loadNotifications();
    }

    function handleClose() {
        setAnchorElement(null);
    }

    async function handleNotificationClick(notification: WorkOrderNotification) {
        if (!notification.isRead) {
            try {
                await markNotificationAsRead(notification.id);

                setNotifications(current =>
                    current.map(n =>
                        n.id === notification.id
                            ? { ...n, isRead: true }
                            : n
                    )
                );

                setUnreadCount(current => Math.max(0, current - 1));
            } catch {
                setErrormessage('Unable to mark this notification as read. Please try again.');

                return;
            }
        }

        handleClose();
        navigate(`/app/my-jobs/${notification.workOrderId}`);
    }

    async function handleMarkAllRead() {
        setIsMarkingAllRead(true);
        setErrormessage(null);

        try {
            await markAllNotificationsAsRead();

            setNotifications(current =>
                current.map(n => ({ 
                    ...n, 
                    isRead: true 
                }))
            );

            setUnreadCount(0);
        } catch {
            setErrormessage('Unable to mark all notifications as read. Please try again.');
        } finally {
            setIsMarkingAllRead(false);
        }
    }

    return (
        <>
            <IconButton
                aria-label={getNotificationAriaLabel(unreadCount)}
                color="inherit"
                onClick={e => void handleOpen(e)}
            >
                <Badge
                    badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                    color='error'
                    max={99}
                >
                    <NotificationsNoneRounded />
                </Badge>
            </IconButton>

            <Popover
                anchorEl={anchorElement}
                anchorOrigin={{
                    horizontal: 'right',
                    vertical: 'bottom'
                }}
                onClose={handleClose}
                open={isOpen}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            width: {
                                xs: 'calc(100vw - 32px)',
                                sm: 420
                            }
                        }
                    }
                }}
                transformOrigin={{
                    horizontal: 'right',
                    vertical: 'top'
                }}
            >
                <Stack spacing={0}>
                    <Stack
                        direction='row'
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: 1.5
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 700 }} variant="subtitle1">
                                Notifications
                            </Typography>

                            <Typography color="text.secondary" variant="body2">
                                {unreadCount === 0
                                    ? 'You are all caught up'
                                    : `${unreadCount} unread notification${unreadCount === 0 ? '' : 's'}.`}
                            </Typography>
                        </Box>

                        <Button
                            disabled={unreadCount === 0 || isMarkingAllRead}
                            loading={isMarkingAllRead}
                            onClick={() => void handleMarkAllRead()}
                            size="small"
                            startIcon={<DoneAllRounded />}
                        >
                            Mark all read
                        </Button>
                    </Stack>

                    <Divider />

                    {errorMessage && (
                        <Alert
                            onClose={() => setErrormessage(null)}
                            severity="error"
                            sx={{ m: 2, mb: 0 }}
                        >
                            {errorMessage}
                        </Alert>
                    )}

                    {isLoading ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                py: 5
                            }}
                        >
                            <CircularProgress aria-label="Loading notifications" size={28} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 600 }}>
                                No notifications yet
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Assignment updates and upcoming-job reminders will appear here.
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding sx={{ maxHeight: 440, overflowY: 'auto' }}>
                            {notifications.map((notification, index) => (
                                <Box key={notification.id}>
                                    {index > 0 && <Divider component='li' />}

                                    <ListItemButton
                                        alignItems="flex-start"
                                        onClick={() => handleNotificationClick(notification)}
                                        sx={{
                                            alignItems: 'flex-start',
                                            bgcolor: notification.isRead
                                                ? 'transparent'
                                                : 'action.hover',
                                            px: 2,
                                            py: 1.5
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    component='span'
                                                    sx={{ fontWeight: notification.isRead ? 600 : 700 }}
                                                >
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                    <Typography
                                                        color="text.secondary"
                                                        variant="body2"
                                                    >
                                                        {notification.message}
                                                    </Typography>

                                                    <Typography
                                                        color="text.secondary"
                                                        variant="caption"
                                                    >
                                                        {formatNotificationDate(notification.createdUtc)}
                                                    </Typography>
                                                </Stack>
                                            }
                                        />
                                    </ListItemButton>
                                </Box>
                            ))}
                        </List>
                    )}
                </Stack>
            </Popover>
        </>
    );
}
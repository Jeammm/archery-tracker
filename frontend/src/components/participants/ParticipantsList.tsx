interface ParticipantsListProps {
  participantDevices: {
    users: Record<string, string>;
  };
}

export const ParticipantsList = (props: ParticipantsListProps) => {
  const { participantDevices } = props;

  return (
    <>
      {Object.entries(participantDevices.users).map(([key, value]) => (
        <div
          className="flex text-sm text-muted-foreground items-center gap-1"
          key={key}
        >
          <p>{value}:</p>
          <div className="flex bg-secondary  px-1 gap-1 rounded-sm items-center">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <p className="text-secondary-foreground text-xs">online</p>
          </div>
          <p>({key})</p>
        </div>
      ))}
    </>
  );
};
